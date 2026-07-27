import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export function setPrismaClient(client: PrismaClient) {
    prisma = client;
}

// ============================================================
// ROLE CRUD QUERIES
// ============================================================

export async function createRole(data: {
    roleName: string;
    description?: string;
    createdById?: string;
}) {
    return prisma.role.create({ data });
}

export async function findRoleById(roleId: string) {
    return prisma.role.findFirst({
        where: { id: roleId, deletedAt: null },
    });
}

export async function findRoleByIdWithPermissions(roleId: string) {
    return prisma.role.findFirst({
        where: { id: roleId, deletedAt: null },
        include: {
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
        },
    });
}

export async function findRoleWithUsers(roleId: string) {
    return prisma.role.findFirst({
        where: { id: roleId, deletedAt: null },
        include: {
            userRoles: {
                take: 1,
            },
        },
    });
}

export async function findRoles(where: any, includePermissions: boolean) {
    return prisma.role.findMany({
        where,
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
        orderBy: { createdAt: 'asc' },
    });
}

export async function updateRole(roleId: string, data: any) {
    return prisma.role.update({
        where: { id: roleId },
        data,
    });
}

export async function softDeleteRole(roleId: string, actorId?: string) {
    return prisma.role.update({
        where: { id: roleId },
        data: {
            deletedAt: new Date(),
            deletedById: actorId,
        },
    });
}
