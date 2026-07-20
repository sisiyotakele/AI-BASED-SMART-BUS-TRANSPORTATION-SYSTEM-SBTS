import { env } from './env';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { RedisClient } from './redis';
import RedisStore from 'rate-limit-redis';

/**
 * Rate Limiting Configuration
 */

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
export function createGeneralLimiter(): RateLimitRequestHandler {
    const config: any = {
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        max: env.RATE_LIMIT_MAX_REQUESTS,
        message: {
            success: false,
            message: 'Too many requests from this IP, please try again later.',
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
    };

    // Use Redis store if available
    const redisClient = RedisClient.getClient();
    if (redisClient) {
        config.store = new RedisStore({
            // @ts-ignore - compatibility with ioredis
            client: redisClient,
            prefix: 'rl:general:',
        });
    }

    return rateLimit(config);
}

/**
 * Auth endpoints rate limiter
 * 5 requests per 15 minutes per IP (stricter)
 */
export function createAuthLimiter(): RateLimitRequestHandler {
    const config: any = {
        windowMs: env.RATE_LIMIT_AUTH_WINDOW_MS,
        max: env.RATE_LIMIT_AUTH_MAX_REQUESTS,
        message: {
            success: false,
            message: 'Too many authentication attempts, please try again later.',
        },
        standardHeaders: true,
        legacyHeaders: false,
        skipSuccessfulRequests: false,
        skipFailedRequests: false,
    };

    const redisClient = RedisClient.getClient();
    if (redisClient) {
        config.store = new RedisStore({
            // @ts-ignore
            client: redisClient,
            prefix: 'rl:auth:',
        });
    }

    return rateLimit(config);
}

/**
 * Strict rate limiter for sensitive operations
 * 3 requests per hour
 */
export function createStrictLimiter(): RateLimitRequestHandler {
    const config: any = {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 3,
        message: {
            success: false,
            message: 'Rate limit exceeded for this operation.',
        },
        standardHeaders: true,
        legacyHeaders: false,
    };

    const redisClient = RedisClient.getClient();
    if (redisClient) {
        config.store = new RedisStore({
            // @ts-ignore
            client: redisClient,
            prefix: 'rl:strict:',
        });
    }

    return rateLimit(config);
}

/**
 * Custom rate limiter factory
 */
export function createCustomLimiter(options: {
    windowMs: number;
    max: number;
    prefix?: string;
    message?: string;
}): RateLimitRequestHandler {
    const config: any = {
        windowMs: options.windowMs,
        max: options.max,
        message: {
            success: false,
            message: options.message || 'Rate limit exceeded.',
        },
        standardHeaders: true,
        legacyHeaders: false,
    };

    const redisClient = RedisClient.getClient();
    if (redisClient) {
        config.store = new RedisStore({
            // @ts-ignore
            client: redisClient,
            prefix: options.prefix || 'rl:custom:',
        });
    }

    return rateLimit(config);
}
