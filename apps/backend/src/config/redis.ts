import { env } from './env';
import { Redis, RedisOptions } from 'ioredis';

/**
 * Redis Configuration for caching, sessions, and pub/sub
 */

export const redisConfig: RedisOptions = {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
    db: env.REDIS_DB,
    keyPrefix: env.REDIS_KEY_PREFIX,

    // Connection settings
    connectTimeout: 10000,
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    enableOfflineQueue: true,

    // Reconnection strategy
    retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`🔄 Redis reconnection attempt ${times}, waiting ${delay}ms...`);
        return delay;
    },

    // Logging
    lazyConnect: false,
    showFriendlyErrorStack: env.NODE_ENV === 'development',
};

/**
 * Redis Client Singleton
 */
class RedisClient {
    private static instance: Redis | null = null;
    private static isConnected = false;

    static async connect(): Promise<Redis | null> {
        if (!env.REDIS_ENABLED) {
            console.log('ℹ️  Redis is disabled');
            return null;
        }

        if (RedisClient.instance && RedisClient.isConnected) {
            return RedisClient.instance;
        }

        try {
            RedisClient.instance = new Redis(redisConfig);

            RedisClient.instance.on('connect', () => {
                console.log('✅ Redis connected');
                RedisClient.isConnected = true;
            });

            RedisClient.instance.on('error', (error) => {
                console.error('❌ Redis error:', error.message);
                RedisClient.isConnected = false;
            });

            RedisClient.instance.on('close', () => {
                console.log('⚠️  Redis connection closed');
                RedisClient.isConnected = false;
            });

            RedisClient.instance.on('reconnecting', () => {
                console.log('🔄 Redis reconnecting...');
            });

            // Wait for connection
            await RedisClient.instance.ping();
            return RedisClient.instance;
        } catch (error) {
            console.error('❌ Failed to connect to Redis:', error);
            RedisClient.instance = null;
            return null;
        }
    }

    static async disconnect(): Promise<void> {
        if (RedisClient.instance) {
            await RedisClient.instance.quit();
            RedisClient.instance = null;
            RedisClient.isConnected = false;
            console.log('✅ Redis disconnected');
        }
    }

    static getClient(): Redis | null {
        return RedisClient.instance;
    }

    static async healthCheck(): Promise<boolean> {
        if (!RedisClient.instance) return false;
        try {
            await RedisClient.instance.ping();
            return true;
        } catch {
            return false;
        }
    }
}

/**
 * Redis utility functions
 */
export const redisUtils = {
    /**
     * Set value with expiration
     */
    async set(key: string, value: any, expirySeconds?: number): Promise<void> {
        const client = RedisClient.getClient();
        if (!client) return;

        const serialized = JSON.stringify(value);
        if (expirySeconds) {
            await client.setex(key, expirySeconds, serialized);
        } else {
            await client.set(key, serialized);
        }
    },

    /**
     * Get and parse value
     */
    async get<T = any>(key: string): Promise<T | null> {
        const client = RedisClient.getClient();
        if (!client) return null;

        const value = await client.get(key);
        if (!value) return null;

        try {
            return JSON.parse(value) as T;
        } catch {
            return value as any;
        }
    },

    /**
     * Delete key(s)
     */
    async del(...keys: string[]): Promise<number> {
        const client = RedisClient.getClient();
        if (!client) return 0;
        return await client.del(...keys);
    },

    /**
     * Check if key exists
     */
    async exists(key: string): Promise<boolean> {
        const client = RedisClient.getClient();
        if (!client) return false;
        const result = await client.exists(key);
        return result === 1;
    },

    /**
     * Set expiration on key
     */
    async expire(key: string, seconds: number): Promise<boolean> {
        const client = RedisClient.getClient();
        if (!client) return false;
        const result = await client.expire(key, seconds);
        return result === 1;
    },

    /**
     * Increment counter
     */
    async incr(key: string): Promise<number> {
        const client = RedisClient.getClient();
        if (!client) return 0;
        return await client.incr(key);
    },

    /**
     * Get keys by pattern
     */
    async keys(pattern: string): Promise<string[]> {
        const client = RedisClient.getClient();
        if (!client) return [];
        return await client.keys(pattern);
    },

    /**
     * Flush all keys (use with caution!)
     */
    async flushAll(): Promise<void> {
        const client = RedisClient.getClient();
        if (!client) return;
        if (env.NODE_ENV !== 'production') {
            await client.flushall();
        } else {
            console.warn('⚠️  flushAll is disabled in production');
        }
    },
};

export { RedisClient };
