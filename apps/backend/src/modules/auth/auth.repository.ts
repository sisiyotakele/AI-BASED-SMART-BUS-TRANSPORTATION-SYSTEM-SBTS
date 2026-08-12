import { PrismaClient } from '@prisma/client';

// Allow prisma client to be injected for testing
let prisma: PrismaClient = new PrismaClient();

export function setPrismaClient(client: PrismaClient) {
    prisma = client;
}

// ============================================================
// ROLE QUERIES
// ============================================================

export async function findRoleByName(roleName: string) {
    return prisma.role.findFirst({
        where: {
            roleName,
            deletedAt: null
        },
    });
}

// ============================================================
// USER QUERIES
// ============================================================

export async function createUserWithRole(data: {
    email: string;
    fullName: string;
    phone: string;
    passwordHash: string;
    roleId: string;
}) {
    return prisma.user.create({
        data: {
            email: data.email,
            fullName: data.fullName,
            phone: data.phone,
            passwordHash: data.passwordHash,
            userRoles: {
                create: {
                    roleId: data.roleId,
                },
            },
        },
        include: {
            userRoles: {
                include: {
                    role: true,
                },
            },
        },
    });
}

export async function findUserByEmail(email: string) {
    return prisma.user.findUnique({
        where: { email },
        include: {
            userRoles: {
                include: {
                    role: {
                        include: {
                            rolePermissions: {
                                include: {
                                    permission: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
}

export async function findUserById(userId: string) {
    return prisma.user.findUnique({
        where: { id: userId },
        include: {
            userRoles: {
                include: {
                    role: {
                        include: {
                            rolePermissions: {
                                include: {
                                    permission: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
}

// ============================================================
// LOGIN HISTORY QUERIES
// ============================================================

export async function createLoginHistory(data: {
    userId?: string;
    action: string;
    ipAddress: string;
    userAgent: string;
}) {
    return prisma.loginHistory.create({
        data: {
            userId: data.userId,
            action: data.action,
            ipAddress: data.ipAddress,
            userAgent: data.userAgent,
        },
    });
}

// ============================================================
// REFRESH TOKEN QUERIES
// ============================================================

export async function createRefreshToken(data: {
    token: string;
    userId: string;
    expiresAt: Date;
}) {
    return prisma.refreshToken.create({
        data: {
            token: data.token,
            userId: data.userId,
            expiresAt: data.expiresAt,
        },
    });
}

export async function findValidRefreshToken(token: string, userId: string) {
    return prisma.refreshToken.findFirst({
        where: {
            token,
            userId,
            expiresAt: { gt: new Date() },
            revokedAt: null,
        },
    });
}

export async function revokeRefreshToken(tokenId: string) {
    return prisma.refreshToken.update({
        where: { id: tokenId },
        data: { revokedAt: new Date() },
    });
}

export async function revokeRefreshTokenByValue(token: string) {
    return prisma.refreshToken.updateMany({
        where: { token },
        data: { revokedAt: new Date() },
    });
}
