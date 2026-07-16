import { Request, Response, NextFunction } from 'express';
import { logger } from '@/common/logger';

/**
 * Response time tracking middleware
 * 
 * Measures request processing time and adds it to response headers.
 * Also logs slow requests (>1 second) for monitoring.
 */

const SLOW_REQUEST_THRESHOLD_MS = 1000; // 1 second

export function responseTimeMiddleware(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();

    // Capture the original end function
    const originalEnd = res.end;

    // Override res.end to calculate response time
    res.end = function (this: Response, ...args: any[]): Response {
        const responseTime = Date.now() - startTime;

        // Add response time header
        res.setHeader('X-Response-Time', `${responseTime}ms`);

        // Log slow requests
        if (responseTime > SLOW_REQUEST_THRESHOLD_MS) {
            logger.warn('Slow request detected', {
                method: req.method,
                path: req.path,
                responseTime,
                requestId: req.id,
                statusCode: res.statusCode,
            });
        }

        // Log all requests in development
        if (process.env.NODE_ENV === 'development') {
            logger.debug('Request completed', {
                method: req.method,
                path: req.path,
                responseTime,
                statusCode: res.statusCode,
                requestId: req.id,
            });
        }

        // Call original end function
        return originalEnd.apply(this, args);
    };

    next();
}
