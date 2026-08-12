import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export function setPrismaClient(client: PrismaClient) {
    prisma = client;
}

// ============================================================
// USER PERMISSION QUERIES
// ============================================================

export async function findUserRolesWithPermissions(userId: string) {
    return prisma.userRole.findMany({
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
}
