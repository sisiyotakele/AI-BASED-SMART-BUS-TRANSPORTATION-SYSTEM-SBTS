import { Request, Response, NextFunction } from 'express';
import { config } from '@/config';
import { logger } from '@/common/logger';
import { errorResponse } from '@/common/response';
import { AppError } from '@/common/errors';

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction) {
  // Log error with request context
  const errorContext = {
    requestId: req.id,
    method: req.method,
    path: req.path,
    ip: req.ip,
  };

  if (err instanceof AppError) {
    logger.warn(err.message, {
      code: err.code,
      statusCode: err.statusCode,
      details: err.details,
      ...errorContext,
    });
    return res.status(err.statusCode).json(errorResponse(err.message, err.code, err.details));
  }

  const prismaError = err as any;
  if (prismaError.code?.startsWith('P')) {
    logger.error('Prisma error', {
      prismaCode: prismaError.code,
      meta: prismaError.meta,
      ...errorContext,
    });
    if (prismaError.code === 'P2025') {
      return res.status(404).json(errorResponse('Record not found', 'NOT_FOUND'));
    }
    if (prismaError.code === 'P2002') {
      return res.status(409).json(errorResponse('Unique constraint violation', 'CONFLICT', { target: prismaError.meta?.target }));
    }
    if (prismaError.code === 'P2003') {
      return res.status(409).json(errorResponse('Foreign key constraint violation', 'CONFLICT'));
    }
    return res.status(500).json(errorResponse('Database error', 'DATABASE_ERROR'));
  }

  logger.error('Unhandled error', {
    stack: err.stack,
    ...errorContext,
  });

  res.status(500).json(
    errorResponse(
      config.env === 'production' ? 'Internal server error' : err.message,
      'INTERNAL_ERROR'
    )
  );
}
