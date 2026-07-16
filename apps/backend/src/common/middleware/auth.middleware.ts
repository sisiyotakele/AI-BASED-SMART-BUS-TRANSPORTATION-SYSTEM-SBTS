import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthenticatedRequest } from '@/common/types';
import { UnauthorizedError } from '@/common/errors';
import { config } from '@/config';

export async function authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return next(new UnauthorizedError('Access token required', 'TOKEN_MISSING'));
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      email: string;
      roles: any[];
    };

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      roles: decoded.roles,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return next(new UnauthorizedError('Token expired', 'TOKEN_EXPIRED'));
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new UnauthorizedError('Invalid token', 'TOKEN_INVALID'));
    }
    next(new UnauthorizedError('Authentication failed'));
  }
}

export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, config.jwt.secret) as {
      userId: string;
      email: string;
      roles: any[];
    };

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      roles: decoded.roles,
    };
  } catch {
    // ignore invalid optional auth
  }
  next();
}
