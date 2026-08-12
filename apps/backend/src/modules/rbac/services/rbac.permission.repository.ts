import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export function setPrismaClient(client: PrismaClient) {
    prisma = client;
}

// ============================================================
// PERMISSION QUERIES
// ============================================================

export async function findPermissions(where: any) {
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
