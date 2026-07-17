import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '@/prisma/client';
import { AppError, ConflictError, NotFoundError } from '@/common/errors';
import { logger } from '@/common/logger';
import type {
  RoleCreateInput,
  RoleUpdateInput,
  AssignPermissionInput,
  AssignRoleInput,
  PermissionFilter,
} from './rbac.types';

// Allow prisma client to be injected for testing
let prisma: PrismaClient = defaultPrisma;

export function setPrismaClient(client: PrismaClient) {
  prisma = client;
}

// ============================================================
// ROLE CRUD
// ============================================================

export async function createRole(input: RoleCreateInput, actorId?: string) {
  try {
    const role = await prisma.role.create({
      data: {
        roleName: input.roleName.toLowerCase().trim(),
        description: input.description,
        createdById: actorId,
      },
    });
    logger.info('Role created', { roleId: role.id, roleName: role.roleName });
    return role;
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('role_name')) {
      throw new ConflictError(
        `Role "${input.roleName}" already exists`,
        'ROLE_NAME_EXISTS',
        { field: 'roleName', value: input.roleName }
      );
    }
    throw error;
  }
}

export async function updateRole(roleId: string, input: RoleUpdateInput) {
  const existing = await prisma.role.findFirst({
    where: { id: roleId, deletedAt: null },
  });
  if (!existing) {
    throw new NotFoundError('Role not found', 'ROLE_NOT_FOUND');
  }

  try {
    const role = await prisma.role.update({
      where: { id: roleId },
      data: {
        ...(input.roleName && { roleName: input.roleName.toLowerCase().trim() }),
        ...(input.description !== undefined && { description: input.description }),
      },
    });
    logger.info('Role updated', { roleId });
    return role;
  } catch (error: any) {
    if (error.code === 'P2002' && error.meta?.target?.includes('role_name')) {
      throw new ConflictError(
        `Role name "${input.roleName}" already exists`,
        'ROLE_NAME_EXISTS',
        { field: 'roleName', value: input.roleName }
      );
    }
    throw error;
  }
}

export async function listRoles(options: { search?: string; includePermissions?: boolean } = {}) {
  const where: any = { deletedAt: null };

  if (options.search) {
    where.OR = [
      { roleName: { contains: options.search, mode: 'insensitive' } },
      { description: { contains: options.search, mode: 'insensitive' } },
    ];
  }

  const roles = await prisma.role.findMany({
    where,
    include: options.includePermissions
      ? {
        rolePermissions: {
          include: {
            permission: {
              select: {
                id: true,
                permissionName: true,
                resource: true,
                action: true,
                description: true,
              },
            },
          },
        },
      }
      : undefined,
    orderBy: { createdAt: 'asc' },
  });

  return roles;
}

export async function getRoleById(roleId: string, includePermissions = false) {
  const role = await prisma.role.findFirst({
    where: { id: roleId, deletedAt: null },
    include: includePermissions
      ? {
        rolePermissions: {
          include: {
            permission: {
              select: {
                id: true,
                permissionName: true,
                resource: true,
                action: true,
                description: true,
              },
            },
          },
        },
      }
      : undefined,
  });

  if (!role) {
    throw new NotFoundError('Role not found', 'ROLE_NOT_FOUND');
  }

  return role;
}

export async function deleteRole(roleId: string, actorId?: string) {
  const existing = await prisma.role.findFirst({
    where: { id: roleId, deletedAt: null },
    include: {
      userRoles: {
        take: 1,
      },
    },
  });

  if (!existing) {
    throw new NotFoundError('Role not found', 'ROLE_NOT_FOUND');
  }

  if (existing.userRoles.length > 0) {
    throw new ConflictError(
      'Cannot delete role that is assigned to users. Remove assignments first.',
      'ROLE_HAS_USERS'
    );
  }

  const role = await prisma.role.update({
    where: { id: roleId },
    data: {
      deletedAt: new Date(),
      deletedById: actorId,
    },
  });

  logger.info('Role soft-deleted', { roleId });
  return role;
}

// ============================================================
// PERMISSIONS
// ============================================================

export async function listPermissions(filters: PermissionFilter = {}) {
  const where: any = {};

  if (filters.resource) {
    where.resource = { equals: filters.resource, mode: 'insensitive' };
  }
  if (filters.action) {
    where.action = { equals: filters.action, mode: 'insensitive' };
  }
  if (filters.search) {
    where.OR = [
      { permissionName: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return prisma.permission.findMany({
    where,
    orderBy: { resource: 'asc' },
    select: {
      id: true,
      permissionName: true,
      resource: true,
      action: true,
      description: true,
      createdAt: true,
    },
  });
}

// ============================================================
// ROLE-PERMISSION ASSIGNMENTS
// ============================================================

export async function assignPermissionToRole(
  roleId: string,
  input: AssignPermissionInput,
  actorId?: string
) {
  const role = await prisma.role.findFirst({
    where: { id: roleId, deletedAt: null },
  });
  if (!role) {
    throw new NotFoundError('Role not found', 'ROLE_NOT_FOUND');
  }

  const permission = await prisma.permission.findUnique({
    where: { id: input.permissionId },
  });
  if (!permission) {
    throw new NotFoundError('Permission not found', 'PERMISSION_NOT_FOUND');
  }

  try {
    const assignment = await prisma.rolePermission.create({
      data: {
        roleId,
        permissionId: input.permissionId,
        createdById: actorId,
      },
      include: {
        permission: {
          select: {
            id: true,
            permissionName: true,
            resource: true,
            action: true,
          },
        },
      },
    });
    logger.info('Permission assigned to role', { roleId, permissionId: input.permissionId });
    return assignment;
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new ConflictError(
        'Permission already assigned to this role',
        'PERMISSION_ALREADY_ASSIGNED',
        { roleId, permissionId: input.permissionId }
      );
    }
    throw error;
  }
}

export async function removePermissionFromRole(roleId: string, permissionId: string) {
  const assignment = await prisma.rolePermission.findFirst({
    where: { roleId, permissionId },
  });

  if (!assignment) {
    throw new NotFoundError(
      'Permission is not assigned to this role',
      'ASSIGNMENT_NOT_FOUND'
    );
  }

  await prisma.rolePermission.delete({
    where: { id: assignment.id },
  });

  logger.info('Permission removed from role', { roleId, permissionId });
  return { removed: true };
}

// ============================================================
// USER-ROLE ASSIGNMENTS
// ============================================================

export async function assignRoleToUser(
  userId: string,
  input: AssignRoleInput,
  actorId?: string
) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  const role = await prisma.role.findFirst({
    where: { id: input.roleId, deletedAt: null },
  });
  if (!role) {
    throw new NotFoundError('Role not found', 'ROLE_NOT_FOUND');
  }

  try {
    const assignment = await prisma.userRole.create({
      data: {
        userId,
        roleId: input.roleId,
        createdById: actorId,
      },
      include: {
        role: {
          select: {
            id: true,
            roleName: true,
            description: true,
          },
        },
      },
    });
    logger.info('Role assigned to user', { userId, roleId: input.roleId });
    return assignment;
  } catch (error: any) {
    if (error.code === 'P2002') {
      throw new ConflictError(
        'Role already assigned to this user',
        'ROLE_ALREADY_ASSIGNED',
        { userId, roleId: input.roleId }
      );
    }
    throw error;
  }
}

export async function removeRoleFromUser(userId: string, roleId: string) {
  const assignment = await prisma.userRole.findFirst({
    where: { userId, roleId },
  });

  if (!assignment) {
    throw new NotFoundError(
      'Role is not assigned to this user',
      'ASSIGNMENT_NOT_FOUND'
    );
  }

  await prisma.userRole.delete({
    where: { id: assignment.id },
  });

  logger.info('Role removed from user', { userId, roleId });
  return { removed: true };
}

export async function getUserRoles(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    include: {
      userRoles: {
        include: {
          role: {
            select: {
              id: true,
              roleName: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new NotFoundError('User not found', 'USER_NOT_FOUND');
  }

  return user.userRoles.map((ur: any) => ur.role);
}

// ============================================================
// PERMISSION CHECKING (used by middleware)
// ============================================================

export async function getUserPermissions(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: {
                select: { permissionName: true },
              },
            },
          },
        },
      },
    },
  });

  const permissionSet = new Set<string>();
  for (const ur of userRoles as any[]) {
    for (const rp of ur.role.rolePermissions as any[]) {
      permissionSet.add(rp.permission.permissionName as string);
    }
  }

  return Array.from(permissionSet);
}

export async function userHasPermission(userId: string, permissionName: string): Promise<boolean> {
  const permissions = await getUserPermissions(userId);
  return permissions.includes(permissionName);
}
