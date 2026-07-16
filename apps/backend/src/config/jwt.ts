import { env } from './env';
import jwt, { SignOptions, VerifyOptions } from 'jsonwebtoken';

/**
 * JWT Configuration and Utilities
 */

export const jwtConfig = {
    access: {
        secret: env.JWT_SECRET,
        expiresIn: env.JWT_EXPIRES_IN,
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
    },
    refresh: {
        secret: env.JWT_REFRESH_SECRET,
        expiresIn: env.JWT_REFRESH_EXPIRES_IN,
        issuer: env.JWT_ISSUER,
        audience: env.JWT_AUDIENCE,
    },
} as const;

/**
 * JWT Token Payload Interface
 */
export interface JwtPayload {
    userId: string;
    email: string;
    type: 'access' | 'refresh';
    iat?: number;
    exp?: number;
    iss?: string;
    aud?: string;
}

/**
 * JWT Utilities
 */
export const jwtUtils = {
    /**
     * Sign access token
     */
    signAccessToken(payload: Omit<JwtPayload, 'type' | 'iat' | 'exp'>): string {
        const options: SignOptions = {
            expiresIn: jwtConfig.access.expiresIn,
            issuer: jwtConfig.access.issuer,
            audience: jwtConfig.access.audience,
        };

        return jwt.sign(
            { ...payload, type: 'access' },
            jwtConfig.access.secret,
            options
        );
    },

    /**
     * Sign refresh token
     */
    signRefreshToken(payload: Omit<JwtPayload, 'type' | 'iat' | 'exp'>): string {
        const options: SignOptions = {
            expiresIn: jwtConfig.refresh.expiresIn,
            issuer: jwtConfig.refresh.issuer,
            audience: jwtConfig.refresh.audience,
        };

        return jwt.sign(
            { ...payload, type: 'refresh' },
            jwtConfig.refresh.secret,
            options
        );
    },

    /**
     * Verify access token
     */
    verifyAccessToken(token: string): JwtPayload {
        const options: VerifyOptions = {
            issuer: jwtConfig.access.issuer,
            audience: jwtConfig.access.audience,
        };

        const payload = jwt.verify(token, jwtConfig.access.secret, options) as JwtPayload;

        if (payload.type !== 'access') {
            throw new Error('Invalid token type');
        }

        return payload;
    },

    /**
     * Verify refresh token
     */
    verifyRefreshToken(token: string): JwtPayload {
        const options: VerifyOptions = {
            issuer: jwtConfig.refresh.issuer,
            audience: jwtConfig.refresh.audience,
        };

        const payload = jwt.verify(token, jwtConfig.refresh.secret, options) as JwtPayload;

        if (payload.type !== 'refresh') {
            throw new Error('Invalid token type');
        }

        return payload;
    },

    /**
     * Decode token without verification (for debugging)
     */
    decode(token: string): JwtPayload | null {
        try {
            return jwt.decode(token) as JwtPayload;
        } catch {
            return null;
        }
    },

    /**
     * Get token expiration time
     */
    getExpirationTime(token: string): Date | null {
        const decoded = jwtUtils.decode(token);
        if (!decoded?.exp) return null;
        return new Date(decoded.exp * 1000);
    },

    /**
     * Check if token is expired
     */
    isExpired(token: string): boolean {
        const exp = jwtUtils.getExpirationTime(token);
        if (!exp) return true;
        return exp < new Date();
    },
};
