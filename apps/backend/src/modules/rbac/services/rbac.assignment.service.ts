import { PrismaClient } from '@prisma/client';
import { ConflictError, NotFoundError } from '@/common/errors';
import { logger } from '@/common/logger';
import type { AssignPermissionInput, AssignRoleInput } from '../rbac.types';

let prisma: PrismaClient;

export function setPrismaClient(client: PrismaClient) {
    prisma = client;
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
