import { PrismaClient } from '@prisma/client';
import { AppError, UnauthorizedError } from '@/common/errors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '@/config';
import { logger } from '@/common/logger';
import { randomBytes } from 'crypto';
import * as repository from './auth.repository';

// Allow prisma client to be injected for testing
export function setPrismaClient(client: PrismaClient) {
    repository.setPrismaClient(client);
}

export async function registerPassenger(data: {
    email: string;
    password: string;
    fullName: string;
    phone: string;
}) {
    // Find the PASSENGER role - with deletedAt filter
    const passengerRole = await repository.findRoleByName('PASSENGER');

    if (!passengerRole) {
        throw new AppError('Passenger role not found. Run seed first.', 500, 'SEED_MISSING');
    }

    const user = await repository.createUserWithRole({
        email: data.email.toLowerCase(),
        fullName: data.fullName,
        phone: data.phone,
        passwordHash: await bcrypt.hash(data.password, 10),
        roleId: passengerRole.id,
    });

    logger.info('Passenger registered', { userId: user.id, email: user.email });

    return user;
}

export async function login(email: string, password: string, ipAddress?: string) {
    const user = await repository.findUserByEmail(email.toLowerCase());

    if (!user) {
        // Log failed attempt
        await repository.createLoginHistory({
            action: 'login_failure',
            ipAddress: ipAddress || 'unknown',
            userAgent: 'unknown',
        });
        throw new UnauthorizedError('Invalid credentials');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
        // Log failed attempt
        await repository.createLoginHistory({
            userId: user.id,
            action: 'login_failure',
            ipAddress: ipAddress || 'unknown',
            userAgent: 'unknown',
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
    await repository.createRefreshToken({
        token: refreshToken,
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    // Log successful login
    await repository.createLoginHistory({
        userId: user.id,
        action: 'login_success',
        ipAddress: ipAddress || 'unknown',
        userAgent: 'unknown',
    });

    logger.info('User logged in', { userId: user.id, email: user.email });

    return {
        accessToken,
        refreshToken,
        mustChangePassword: user.mustChangePassword,
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
    const storedToken = await repository.findValidRefreshToken(refreshToken, payload.userId);

    if (!storedToken) {
        throw new UnauthorizedError('Invalid refresh token');
    }

    // Fetch the user with roles and permissions
    const user = await repository.findUserById(payload.userId);

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
    await repository.revokeRefreshToken(storedToken.id);

    await repository.createRefreshToken({
        token: newRefreshToken,
        userId: payload.userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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

    await repository.revokeRefreshTokenByValue(refreshToken);

    // Log logout action if we have a valid userId
    if (payload?.userId) {
        await repository.createLoginHistory({
            userId: payload.userId,
            action: 'logout',
            ipAddress: ipAddress || 'unknown',
            userAgent: 'unknown',
        });
    }

    logger.info('User logged out');
}

export async function getMe(userId: string) {
    const user = await repository.findUserById(userId);

    if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        mustChangePassword: user.mustChangePassword,
        roles: user.userRoles.map((ur) => ({
            id: ur.role.id,
            name: ur.role.roleName,
            permissions: ur.role.rolePermissions.map((rp) => rp.permission.permissionName),
        })),
    };
}

/**
 * Change password - used when:
 *   1. User is forced to change admin-assigned password (mustChangePassword = true)
 *   2. User voluntarily changes their own password
 */
export async function changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
) {
    const user = await repository.findUserById(userId);

    if (!user) {
        throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValidPassword) {
        throw new UnauthorizedError('Current password is incorrect');
    }

    if (currentPassword === newPassword) {
        throw new AppError(
            'New password must be different from the current password',
            400,
            'SAME_PASSWORD'
        );
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await repository.updateUserPassword(userId, newPasswordHash);

    logger.info('Password changed', { userId });
    return { message: 'Password changed successfully' };
}

/**
 * Initiate forgot-password flow:
 * Generates a time-limited reset token and stores it on the user.
 * In production this token would be emailed; here we return it directly.
 */
export async function forgotPassword(email: string) {
    const user = await repository.findUserByEmail(email.toLowerCase());

    // Always return the same message so we don't leak whether an email exists
    if (!user) {
        logger.warn('Forgot-password attempt for unknown email', { email });
        return { message: 'If this email exists, a reset link has been sent.' };
    }

    const resetToken = randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await repository.setPasswordResetToken(user.id, resetToken, expiry);

    logger.info('Password reset token generated', { userId: user.id });

    // TODO: Send email with reset link containing the token
    // For now, return the token so it can be used directly in development
    return {
        message: 'If this email exists, a reset link has been sent.',
        // Only expose in development
        ...(process.env.NODE_ENV === 'development' && { resetToken }),
    };
}

/**
 * Reset password using the token provided during forgot-password flow.
 * Sets mustChangePassword = false after successful reset.
 */
export async function resetPassword(token: string, newPassword: string) {
    const user = await repository.findUserByResetToken(token);

    if (!user) {
        throw new AppError('Invalid or expired reset token', 400, 'INVALID_RESET_TOKEN');
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await repository.updateUserPassword(user.id, newPasswordHash);

    logger.info('Password reset via token', { userId: user.id });
    return { message: 'Password reset successfully. Please log in with your new password.' };
}