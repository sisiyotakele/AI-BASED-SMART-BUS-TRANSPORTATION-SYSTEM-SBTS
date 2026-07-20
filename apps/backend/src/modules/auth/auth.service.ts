import { PrismaClient } from '@prisma/client';
import { AppError, UnauthorizedError } from '@/common/errors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { logger } from '@/common/logger';
import { randomBytes } from 'crypto';

// Allow prisma client to be injected for testing
let prisma: PrismaClient = new PrismaClient();

export function setPrismaClient(client: PrismaClient) {
    prisma = client;
}

export async function registerPassenger(data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
}) {
    // Find the PASSENGER role - with deletedAt filter
    const passengerRole = await prisma.role.findFirst({
        where: {
            roleName: 'PASSENGER',
            deletedAt: null
        },
    });

    if (!passengerRole) {
        throw new AppError('Passenger role not found. Run seed first.', 500, 'SEED_MISSING');
    }

    const user = await prisma.user.create({
        data: {
            email: data.email.toLowerCase(),
            fullName: data.fullName,
            phone: data.phone,
            passwordHash: await bcrypt.hash(data.password, 10),
            userRoles: {
                create: {
                    roleId: passengerRole.id,
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

    logger.info('Passenger registered', { userId: user.id, email: user.email });

    return user;
}

export async function login(email: string, password: string, ipAddress?: string) {
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
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

    if (!user) {
        // Log failed attempt
        await prisma.loginHistory.create({
            data: {
                action: 'login_failure',
                ipAddress: ipAddress || 'unknown',
                userAgent: 'unknown',
            },
        });
        throw new UnauthorizedError('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
        // Log failed attempt
        await prisma.loginHistory.create({
            data: {
                userId: user.id,
                action: 'login_failure',
                ipAddress: ipAddress || 'unknown',
                userAgent: 'unknown',
            },
        });
        throw new UnauthorizedError('Invalid credentials');
    }

    // Generate tokens - Including roles and permissions in the Access Token
    const accessToken = jwt.sign(
        {
            userId: user.id,
            email: user.email,
            roles: user.userRoles.map((ur) => ({
                id: ur.role.id,
                name: ur.role.roleName,
                permissions: ur.role.rolePermissions.map(
                    (rp) => rp.permission.permissionName
                ),
            })),
            jti: randomBytes(16).toString("hex"),
        },
        config.jwt.secret,
        {
            expiresIn: config.jwt.expiresIn as any,
        }
    );

    const refreshToken = jwt.sign(
        { userId: user.id, email: user.email, jti: randomBytes(16).toString('hex') },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn as any }
    );

    // Store refresh token
    await prisma.refreshToken.create({
        data: {
            token: refreshToken,
            userId: user.id,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        },
    });

    // Log successful login
    await prisma.loginHistory.create({
        data: {
            userId: user.id,
            action: 'login_success',
            ipAddress: ipAddress || 'unknown',
            userAgent: 'unknown',
        },
    });

    logger.info('User logged in', { userId: user.id, email: user.email });

    return {
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            roles: user.userRoles.map((ur) => ur.role.roleName),
        },
    };
}

export async function refreshTokens(refreshToken: string) {
    let payload: any;

    try {
        payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch (error) {
        throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if token exists in database
    const storedToken = await prisma.refreshToken.findFirst({
        where: {
            token: refreshToken,
            userId: payload.userId,
            expiresAt: { gt: new Date() },
            revokedAt: null,
        },
    });

    if (!storedToken) {
        throw new UnauthorizedError('Invalid refresh token');
    }

    // Fetch the user with roles and permissions
    const user = await prisma.user.findUnique({
        where: {
            id: payload.userId,
        },
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

    if (!user) {
        throw new UnauthorizedError("User not found");
    }

    // Generate new tokens
    const accessToken = jwt.sign(
        {
            userId: user.id,
            email: user.email,
            roles: user.userRoles.map((ur) => ({
                id: ur.role.id,
                name: ur.role.roleName,
                permissions: ur.role.rolePermissions.map(
                    (rp) => rp.permission.permissionName
                ),
            })),
            jti: randomBytes(16).toString("hex"),
        },
        config.jwt.secret,
        {
            expiresIn: config.jwt.expiresIn as any,
        }
    );

    const newRefreshToken = jwt.sign(
        { userId: payload.userId, email: payload.email, jti: randomBytes(16).toString('hex') },
        config.jwt.refreshSecret,
        { expiresIn: config.jwt.refreshExpiresIn as any }
    );

    // Revoke old token and store new one
    await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { revokedAt: new Date() },
    });

    await prisma.refreshToken.create({
        data: {
            token: newRefreshToken,
            userId: payload.userId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
    });

    logger.info('Tokens refreshed', { userId: payload.userId });

    return {
        accessToken,
        refreshToken: newRefreshToken,
    };
}

export async function logout(refreshToken: string, ipAddress?: string) {
    // Decode token to get userId
    let payload: any;
    try {
        payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch (error) {
        // Token might be invalid but we still want to try revoking it
        payload = jwt.decode(refreshToken);
    }

    await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { revokedAt: new Date() },
    });

    // Log logout action if we have a valid userId
    if (payload?.userId) {
        await prisma.loginHistory.create({
            data: {
                userId: payload.userId,
                action: 'logout',
                ipAddress: ipAddress || 'unknown',
                userAgent: 'unknown',
            },
        });
    }

    logger.info('User logged out');
}

export async function getMe(userId: string) {
    const user = await prisma.user.findUnique({
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

    if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        roles: user.userRoles.map((ur) => ({
            id: ur.role.id,
            name: ur.role.roleName,
            permissions: ur.role.rolePermissions.map((rp) => rp.permission.permissionName),
        })),
    };
}