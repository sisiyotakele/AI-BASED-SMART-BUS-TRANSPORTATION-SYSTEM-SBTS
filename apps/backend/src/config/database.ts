import { env } from './env';

/**
 * Database Configuration
 * Centralized Prisma client configuration
 */

export const databaseConfig = {
    url: env.DATABASE_URL,

    pool: {
        min: env.DB_POOL_MIN,
        max: env.DB_POOL_MAX,
    },

    connection: {
        connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT,
        idleTimeoutMillis: env.DB_IDLE_TIMEOUT,
    },

    logging: env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],

    errorFormat: env.NODE_ENV === 'development' ? 'pretty' : 'minimal',
} as const;

/**
 * Prisma Client Options
 */
export const prismaClientOptions = {
    datasources: {
        db: {
            url: databaseConfig.url,
        },
    },
    log: databaseConfig.logging as any,
    errorFormat: databaseConfig.errorFormat as any,
} as const;

/**
 * Database health check
 */
export async function checkDatabaseConnection(prisma: any): Promise<boolean> {
    try {
        await prisma.$queryRaw`SELECT 1`;
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        return false;
    }
}

/**
 * Graceful database disconnect
 */
export async function disconnectDatabase(prisma: any): Promise<void> {
    try {
        await prisma.$disconnect();
        console.log('✅ Database disconnected');
    } catch (error) {
        console.error('❌ Error disconnecting database:', error);
        throw error;
    }
}
