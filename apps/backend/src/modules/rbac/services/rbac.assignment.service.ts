import { PrismaClient } from '@prisma/client';
import { ConflictError, NotFoundError } from '@/common/errors';
import { logger } from '@/common/logger';
import type { AssignPermissionInput, AssignRoleInput } from '../rbac.types';
import * as repository from './rbac.assignment.repository';

export function setPrismaClient(client: PrismaClient) {
    repository.setPrismaClient(client);
}

// ============================================================
// ROLE-PERMISSION ASSIGNMENTS
// ============================================================

export async function assignPermissionToRole(
    roleId: string,
    input: AssignPermissionInput,
    actorId?: string
) {
    const role = await repository.findRoleById(roleId);
    if (!role) {
        throw new NotFoundError('Role not found', 'ROLE_NOT_FOUND');
    }

    const permission = await repository.findPermissionById(input.permissionId);
    if (!permission) {
        throw new NotFoundError('Permission not found', 'PERMISSION_NOT_FOUND');
    }

    try {
        const assignment = await repository.createRolePermission({
            roleId,
            permissionId: input.permissionId,
            createdById: actorId,
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
    const assignment = await repository.findRolePermission(roleId, permissionId);

    if (!assignment) {
        throw new NotFoundError(
            'Permission is not assigned to this role',
            'ASSIGNMENT_NOT_FOUND'
        );
    }

    await repository.deleteRolePermission(assignment.id);

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
    const user = await repository.findUserById(userId);
    if (!user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    const role = await repository.findRoleById(input.roleId);
    if (!role) {
        throw new NotFoundError('Role not found', 'ROLE_NOT_FOUND');
    }

    try {
        const assignment = await repository.createUserRole({
            userId,
            roleId: input.roleId,
            createdById: actorId,
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
    const assignment = await repository.findUserRole(userId, roleId);

    if (!assignment) {
        throw new NotFoundError(
            'Role is not assigned to this user',
            'ASSIGNMENT_NOT_FOUND'
        );
    }

    await repository.deleteUserRole(assignment.id);

    logger.info('Role removed from user', { userId, roleId });
    return { removed: true };
}

export async function getUserRoles(userId: string) {
    const user = await repository.findUserWithRoles(userId);

    if (!user) {
        throw new NotFoundError('User not found', 'USER_NOT_FOUND');
    }

    return user.userRoles.map((ur: any) => ur.role);
}
