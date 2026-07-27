import { PrismaClient } from '@prisma/client';
import type { PermissionFilter } from '../rbac.types';

let prisma: PrismaClient;

export function setPrismaClient(client: PrismaClient) {
    prisma = client;
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
