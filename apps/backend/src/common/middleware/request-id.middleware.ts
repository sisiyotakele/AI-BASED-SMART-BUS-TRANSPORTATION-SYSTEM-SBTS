import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID (correlation ID) middleware
 * 
 * Generates or extracts a unique request ID for tracing requests through logs.
 * The ID is added to response headers and available on req.id
 */

declare global {
    namespace Express {
        interface Request {
            id?: string;
        }
    }
}

export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
    // Check if request ID already exists in header (from load balancer/proxy)
    const existingId = req.headers['x-request-id'] as string;

    // Use existing or generate new UUID
    const requestId = existingId || uuidv4();

    // Attach to request object
    req.id = requestId;

    // Add to response headers for client tracking
    res.setHeader('X-Request-ID', requestId);

    next();
}
