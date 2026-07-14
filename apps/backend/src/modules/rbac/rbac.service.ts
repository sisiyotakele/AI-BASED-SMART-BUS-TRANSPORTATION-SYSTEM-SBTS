import { prisma } from '../../config/database';
import { ConflictError, NotFoundError, BadRequestError } from '../../utils/errors';
import { CreateRoleInput, UpdateRoleInput } from './rbac.types';

function isUniqueViolation(error: any): boolean {
  return error?.code === 'P2002' || error?.meta?.target !== undefined;
}

export class RbacService {
  // ================= ROLES =================

  async getAllRoles(includePermissions = true, includeUserCount = true) {
    const roles = await prisma.role.findMany({
      where: { deleted_at: null },
      include: {
        role_permissions: includePermissions
          ? {
              include: { permission: true },
            }
          : false,
        _count: includeUserCount
          ? {
              select: { user_roles: true },
            }
          : undefined,
      },
      orderBy: { role_name: 'asc' },
    });

    return roles.map((role: any) => ({
      id: role.id,
      role_name: role.role_name,
      description: role.description,
      created_at: role.created_at,
      updated_at: role.updated_at,
      permissions: includePermissions
        ? role.role_permissions.map((rp: any) => ({
            id: rp.permission.id,
            permission_name: rp.permission.permission_name,
            resource: rp.permission.resource,
            action: rp.permission.action,
            description: rp.permission.description,
          }))
        : undefined,
      users_count: includeUserCount ? role._count?.user_roles : undefined,
    }));
  }

  async getRoleById(id: string) {
    const role = await prisma.role.findFirst({
      where: { id, deleted_at: null },
      include: {
        role_permissions: { include: { permission: true } },
        user_roles: { include: { user: { select: { id: true, full_name: true, email: true } } } },
      },
    });

    if (!role) {
      throw new NotFoundError(`Role with id ${id} not found`);
    }

    return {
      id: role.id,
      role_name: role.role_name,
      description: role.description,
      created_at: role.created_at,
      updated_at: role.updated_at,
      permissions: role.role_permissions.map((rp: any) => ({
        id: rp.permission.id,
        permission_name: rp.permission.permission_name,
        resource: rp.permission.resource,
        action: rp.permission.action,
      })),
      users: role.user_roles.map((ur: any) => ur.user),
    };
  }

  async getRoleByName(role_name: string) {
    return prisma.role.findFirst({
      where: { role_name, deleted_at: null },
    });
  }

  async createRole(input: CreateRoleInput) {
    try {
      const role = await prisma.role.create({
        data: {
          role_name: input.role_name.toLowerCase().trim(),
          description: input.description,
          created_by: input.created_by,
        },
      });
      return role;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictError(`Role with name '${input.role_name}' already exists`, 'role_name');
      }
      throw error;
    }
  }

  async updateRole(id: string, input: UpdateRoleInput) {
    const existing = await prisma.role.findFirst({ where: { id, deleted_at: null } });
    if (!existing) {
      throw new NotFoundError(`Role with id ${id} not found`);
    }

    try {
      const updated = await prisma.role.update({
        where: { id },
        data: {
          role_name: input.role_name?.toLowerCase().trim(),
          description: input.description,
          updated_by: input.updated_by,
          updated_at: new Date(),
        },
      });
      return updated;
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictError(`Role name '${input.role_name}' already in use`, 'role_name');
      }
      throw error;
    }
  }

  async deleteRole(id: string, deleted_by?: string) {
    const existing = await prisma.role.findFirst({ where: { id, deleted_at: null } });
    if (!existing) {
      throw new NotFoundError(`Role with id ${id} not found`);
    }

    const userCount = await prisma.userRole.count({ where: { role_id: id } });
    if (userCount > 0) {
      throw new BadRequestError(`Cannot delete role assigned to ${userCount} users. Unassign first.`);
    }

    return prisma.role.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        deleted_by: deleted_by,
      } as any,
    });
  }

  // ================= PERMISSIONS =================

  async getAllPermissions() {
    return prisma.permission.findMany({
      where: { deleted_at: null },
      orderBy: [{ resource: 'asc' }, { action: 'asc' }],
    });
  }

  async getPermissionById(id: string) {
    const permission = await prisma.permission.findFirst({ where: { id, deleted_at: null } });
    if (!permission) {
      throw new NotFoundError(`Permission with id ${id} not found`);
    }
    return permission;
  }

  async createPermission(input: { permission_name: string; resource: string; action: string; description?: string; created_by?: string }) {
    try {
      return await prisma.permission.create({
        data: {
          permission_name: input.permission_name,
          resource: input.resource,
          action: input.action,
          description: input.description,
          created_by: input.created_by,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictError(`Permission '${input.permission_name}' already exists`, 'permission_name');
      }
      throw error;
    }
  }

  // ================= ROLE-PERMISSION LINK =================

  async attachPermissionToRole(role_id: string, permission_id: string, created_by?: string) {
    const role = await prisma.role.findFirst({ where: { id: role_id, deleted_at: null } });
    if (!role) throw new NotFoundError(`Role ${role_id} not found`);

    const permission = await prisma.permission.findFirst({ where: { id: permission_id, deleted_at: null } });
    if (!permission) throw new NotFoundError(`Permission ${permission_id} not found`);

    try {
      return await prisma.rolePermission.create({
        data: {
          role_id,
          permission_id,
          created_by,
        },
        include: {
          permission: true,
          role: true,
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictError(`Permission already assigned to this role`, 'permission_id');
      }
      throw error;
    }
  }

  async attachPermissionsBulk(role_id: string, permission_ids: string[], created_by?: string) {
    const role = await prisma.role.findFirst({ where: { id: role_id, deleted_at: null } });
    if (!role) throw new NotFoundError(`Role ${role_id} not found`);

    const permissions = await prisma.permission.findMany({
      where: { id: { in: permission_ids }, deleted_at: null },
    });
    if (permissions.length !== permission_ids.length) {
      throw new BadRequestError('One or more permission_ids are invalid');
    }

    const results: any[] = [];
    const errors: string[] = [];

    for (const pid of permission_ids) {
      try {
        const rp = await prisma.rolePermission.create({
          data: { role_id, permission_id: pid, created_by },
        });
        results.push(rp);
      } catch (error: any) {
        if (error?.code === 'P2002') {
          errors.push(pid);
        } else {
          throw error;
        }
      }
    }

    return {
      attached: results.length,
      skipped_already_assigned: errors.length,
      skipped_ids: errors,
      data: results,
    };
  }

  async detachPermissionFromRole(role_id: string, permission_id: string) {
    const existing = await prisma.rolePermission.findFirst({
      where: { role_id, permission_id },
    });
    if (!existing) {
      throw new NotFoundError('Permission not assigned to this role');
    }

    await prisma.rolePermission.delete({
      where: { id: existing.id },
    });

    return { message: 'Permission detached' };
  }

  async getRolePermissions(role_id: string) {
    const role = await prisma.role.findFirst({ where: { id: role_id, deleted_at: null } });
    if (!role) throw new NotFoundError(`Role ${role_id} not found`);

    const rolePermissions = await prisma.rolePermission.findMany({
      where: { role_id },
      include: { permission: true },
    });

    return rolePermissions.map((rp: any) => rp.permission);
  }

  // ================= USER-ROLE LINK =================

  async assignRoleToUser(user_id: string, role_id: string, created_by?: string) {
    const user = await prisma.user.findFirst({ where: { id: user_id, deleted_at: null } });
    if (!user) throw new NotFoundError(`User ${user_id} not found`);

    const role = await prisma.role.findFirst({ where: { id: role_id, deleted_at: null } });
    if (!role) throw new NotFoundError(`Role ${role_id} not found`);

    try {
      return await prisma.userRole.create({
        data: {
          user_id,
          role_id,
          created_by,
        },
        include: {
          role: true,
          user: { select: { id: true, full_name: true, email: true } },
        },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictError(`User already has this role`, 'role_id');
      }
      throw error;
    }
  }

  async assignRolesBulkToUser(user_id: string, role_ids: string[], created_by?: string) {
    const user = await prisma.user.findFirst({ where: { id: user_id, deleted_at: null } });
    if (!user) throw new NotFoundError(`User ${user_id} not found`);

    const roles = await prisma.role.findMany({ where: { id: { in: role_ids }, deleted_at: null } });
    if (roles.length !== role_ids.length) {
      throw new BadRequestError('One or more role_ids are invalid');
    }

    const results: any[] = [];
    const skipped: string[] = [];

    for (const rid of role_ids) {
      try {
        const ur = await prisma.userRole.create({
          data: { user_id, role_id: rid, created_by },
        });
        results.push(ur);
      } catch (error: any) {
        if (error?.code === 'P2002') {
          skipped.push(rid);
        } else {
          throw error;
        }
      }
    }

    return {
      assigned: results.length,
      skipped_already_assigned: skipped.length,
      skipped_ids: skipped,
      data: results,
    };
  }

  async removeRoleFromUser(user_id: string, role_id: string) {
    const existing = await prisma.userRole.findFirst({
      where: { user_id, role_id },
    });
    if (!existing) {
      throw new NotFoundError('User does not have this role');
    }

    await prisma.userRole.delete({ where: { id: existing.id } });
    return { message: 'Role removed from user' };
  }

  async getUserRoles(user_id: string) {
    const user = await prisma.user.findFirst({ where: { id: user_id, deleted_at: null } });
    if (!user) throw new NotFoundError(`User ${user_id} not found`);

    const userRoles = await prisma.userRole.findMany({
      where: { user_id },
      include: { role: { include: { role_permissions: { include: { permission: true } } } } },
    });

    const roles = userRoles.map((ur: any) => ur.role);
    const permissions = Array.from(
      new Set(
        userRoles.flatMap((ur: any) => ur.role.role_permissions.map((rp: any) => rp.permission.permission_name))
      )
    );

    return {
      user_id,
      roles: roles.map((r: any) => ({ id: r.id, role_name: r.role_name, description: r.description })),
      permissions,
      detailed: userRoles.map((ur: any) => ({
        role_id: ur.role.id,
        role_name: ur.role.role_name,
        permissions: ur.role.role_permissions.map((rp: any) => rp.permission),
      })),
    };
  }

  // ================= PERMISSION CHECKER =================

  async getUserPermissions(user_id: string): Promise<string[]> {
    const userRoles = await prisma.userRole.findMany({
      where: { user_id },
      include: {
        role: {
          include: { role_permissions: { include: { permission: true } } },
        },
      },
    });

    const permissions = new Set<string>();
    for (const ur of userRoles as any[]) {
      for (const rp of (ur as any).role.role_permissions) {
        permissions.add(rp.permission.permission_name);
      }
    }
    return Array.from(permissions);
  }

  async hasPermission(user_id: string, permission_name: string): Promise<boolean> {
    const count = await prisma.rolePermission.count({
      where: {
        permission: { permission_name },
        role: {
          user_roles: { some: { user_id } },
          deleted_at: null,
        },
      },
    });
    return count > 0;
  }

  async getUserRolesNames(user_id: string): Promise<string[]> {
    const roles = await prisma.userRole.findMany({
      where: { user_id },
      include: { role: true },
    });
    return roles.map((ur: any) => ur.role.role_name);
  }
}

export const rbacService = new RbacService();
