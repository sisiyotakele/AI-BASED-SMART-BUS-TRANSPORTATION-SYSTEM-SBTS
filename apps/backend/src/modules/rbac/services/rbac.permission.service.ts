import { PrismaClient } from '@prisma/client';
import type { PermissionFilter } from '../rbac.types';
import * as repository from './rbac.permission.repository';

export function setPrismaClient(client: PrismaClient) {
    repository.setPrismaClient(client);
}

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

    return repository.findPermissions(where);
}
