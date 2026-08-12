import { PrismaClient } from '@prisma/client';
import { ConflictError, NotFoundError } from '@/common/errors';
import { logger } from '@/common/logger';
import type { RoleCreateInput, RoleUpdateInput } from '../rbac.types';
import * as repository from './rbac.role.repository';

export function setPrismaClient(client: PrismaClient) {
    repository.setPrismaClient(client);
}

export async function createRole(input: RoleCreateInput, actorId?: string) {
    try {
        const role = await repository.createRole({
            roleName: input.roleName.toLowerCase().trim(),
            description: input.description,
            createdById: actorId,
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
    const existing = await repository.findRoleById(roleId);
    if (!existing) {
        throw new NotFoundError('Role not found', 'ROLE_NOT_FOUND');
    }

    try {
        const role = await repository.updateRole(roleId, {
            ...(input.roleName && { roleName: input.roleName.toLowerCase().trim() }),
            ...(input.description !== undefined && { description: input.description }),
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

    const roles = await repository.findRoles(where, options.includePermissions || false);
    return roles;
}

export async function getRoleById(roleId: string, includePermissions = false) {
    const role = includePermissions
        ? await repository.findRoleByIdWithPermissions(roleId)
        : await repository.findRoleById(roleId);

    if (!role) {
        throw new NotFoundError('Role not found', 'ROLE_NOT_FOUND');
    }

    return role;
}

export async function deleteRole(roleId: string, actorId?: string) {
    const existing = await repository.findRoleWithUsers(roleId);

    if (!existing) {
        throw new NotFoundError('Role not found', 'ROLE_NOT_FOUND');
    }

    if (existing.userRoles.length > 0) {
        throw new ConflictError(
            'Cannot delete role that is assigned to users. Remove assignments first.',
            'ROLE_HAS_USERS'
        );
    }

    const role = await repository.softDeleteRole(roleId, actorId);

    logger.info('Role soft-deleted', { roleId });
    return role;
}
