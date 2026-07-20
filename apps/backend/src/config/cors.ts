import { CorsOptions } from 'cors';
import { env } from './env';

/**
 * CORS Configuration
 */

export const corsConfig: CorsOptions = {
    origin: (origin, callback) => {
        const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());

        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) {
            return callback(null, true);
        }

        // Allow all origins in development
        if (env.NODE_ENV === 'development' && allowedOrigins.includes('*')) {
            return callback(null, true);
        }

        // Check if origin is in allowed list
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error(`Origin ${origin} not allowed by CORS policy`));
        }
    },

    credentials: env.CORS_CREDENTIALS,

    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

    allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'X-Request-ID',
        'Accept',
        'Origin',
    ],

    exposedHeaders: [
        'X-Request-ID',
        'X-Response-Time',
        'X-RateLimit-Limit',
        'X-RateLimit-Remaining',
        'X-RateLimit-Reset',
    ],

    maxAge: env.CORS_MAX_AGE,

    preflightContinue: false,

    optionsSuccessStatus: 204,
};

/**
 * CORS helper functions
 */
export const corsUtils = {
    /**
     * Check if origin is allowed
     */
    isOriginAllowed(origin: string): boolean {
        const allowedOrigins = env.CORS_ORIGIN.split(',').map(o => o.trim());
        return allowedOrigins.includes('*') || allowedOrigins.includes(origin);
    },

    /**
     * Get allowed origins list
     */
    getAllowedOrigins(): string[] {
        return env.CORS_ORIGIN.split(',').map(o => o.trim());
    },

    /**
     * Validate CORS configuration
     */
    validateConfig(): void {
        if (env.NODE_ENV === 'production' && env.CORS_ORIGIN === '*') {
            console.warn(
                '⚠️  SECURITY WARNING: CORS is configured to allow all origins in production. ' +
                'This is a security risk! Update CORS_ORIGIN environment variable to specific domains.'
            );
        }

        if (env.CORS_CREDENTIALS && env.CORS_ORIGIN === '*') {
            console.warn(
                '⚠️  CORS WARNING: Credentials cannot be used with wildcard origin. ' +
                'Either disable credentials or specify exact origins.'
            );
        }
    },
};
