import { prisma } from '@/prisma/client';
import { config } from '@/config';
import { logger } from './logger';

export interface HealthStatus {
    status: 'healthy' | 'degraded' | 'unhealthy';
    timestamp: string;
    uptime: number;
    environment: string;
    version: string;
    dependencies: {
        database: DependencyHealth;
        // redis?: DependencyHealth; // Uncomment when Redis is implemented
    };
}

export interface DependencyHealth {
    status: 'up' | 'down';
    responseTime?: number;
    error?: string;
}

/**
 * Check database connectivity and response time
 */
async function checkDatabase(): Promise<DependencyHealth> {
    const start = Date.now();

    try {
        // Simple query to check DB connectivity
        await prisma.$queryRaw`SELECT 1`;
        const responseTime = Date.now() - start;

        return {
            status: 'up',
            responseTime,
        };
    } catch (error: any) {
        logger.error('Database health check failed', { error: error.message });
        return {
            status: 'down',
            error: error.message || 'Database connection failed',
        };
    }
}

/**
 * Check Redis connectivity (placeholder for when Redis is implemented)
 */
// async function checkRedis(): Promise<DependencyHealth> {
//   const start = Date.now();
//   
//   try {
//     // Redis ping check would go here
//     const responseTime = Date.now() - start;
//     
//     return {
//       status: 'up',
//       responseTime,
//     };
//   } catch (error: any) {
//     return {
//       status: 'down',
//       error: error.message || 'Redis connection failed',
//     };
//   }
// }

/**
 * Get comprehensive health status
 */
export async function getHealthStatus(): Promise<HealthStatus> {
    const database = await checkDatabase();
    // const redis = await checkRedis(); // Uncomment when Redis is implemented

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (database.status === 'down') {
        status = 'unhealthy';
    }
    // if (redis.status === 'down') {
    //   status = database.status === 'down' ? 'unhealthy' : 'degraded';
    // }

    return {
        status,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: config.env,
        version: process.env.npm_package_version || '1.0.0',
        dependencies: {
            database,
            // redis, // Uncomment when Redis is implemented
        },
    };
}

/**
 * Simple health check (just returns 200 if server is running)
 */
export function getSimpleHealth() {
    return {
        success: true,
        message: 'SBTS Backend is operational',
        timestamp: new Date().toISOString(),
        environment: config.env,
    };
}
