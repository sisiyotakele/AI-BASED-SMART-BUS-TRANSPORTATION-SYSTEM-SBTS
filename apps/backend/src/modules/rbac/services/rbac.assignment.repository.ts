import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

export function setPrismaClient(client: PrismaClient) {
    prisma = client;
}

// ============================================================
// ROLE QUERIES
// ============================================================

export async function findRoleById(roleId: string) {
    return prisma.role.findFirst({
        where: { id: roleId, deletedAt: null },
    });
}

// ============================================================
// PERMISSION QUERIES
// ============================================================

export async function findPermissionById(permissionId: string) {
    return prisma.permission.findUnique({
        where: { id: permissionId },
    });
}

// ============================================================
// USER QUERIES
// ============================================================

export async function findUserById(userId: string) {
    return prisma.user.findFirst({
        where: { id: userId, deletedAt: null },
    });
}

export async function findUserWithRoles(userId: string) {
    return prisma.user.findFirst({
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
}

// ============================================================
// ROLE-PERMISSION ASSIGNMENT QUERIES
// ============================================================

export async function createRolePermission(data: {
    roleId: string;
    permissionId: string;
    createdById?: string;
}) {
    return prisma.rolePermission.create({
        data,
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
}

export async function findRolePermission(roleId: string, permissionId: string) {
    return prisma.rolePermission.findFirst({
        where: { roleId, permissionId },
    });
}

export async function deleteRolePermission(assignmentId: string) {
    return prisma.rolePermission.delete({
        where: { id: assignmentId },
    });
}

// ============================================================
// USER-ROLE ASSIGNMENT QUERIES
// ============================================================

export async function createUserRole(data: {
    userId: string;
    roleId: string;
    createdById?: string;
}) {
    return prisma.userRole.create({
        data,
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
}

export async function findUserRole(userId: string, roleId: string) {
    return prisma.userRole.findFirst({
        where: { userId, roleId },
    });
}

export async function deleteUserRole(assignmentId: string) {
    return prisma.userRole.delete({
        where: { id: assignmentId },
    });
}
