import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/common/types';
import { prisma } from '@/prisma/client';
import { logger } from '@/common/logger';

/**
 * Audit logging middleware.
 * Captures old_values before mutation and writes audit_logs row after success.
 * Usage: apply to mutating routes (POST/PATCH/DELETE) that should be audited.
 */
export function auditLog(entityName: string, actionDescription?: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send.bind(res);
    const entityId = req.params.id || req.params[`${entityName}Id`] || req.body.id;
    let oldValues: string | null = null;

    // Try to read current state before mutation (for updates/deletes)
    if (req.method !== 'POST' && entityId) {
      try {
        const record = await (prisma as any)[entityName]?.findUnique?.({
          where: { id: entityId },
        });
        if (record) oldValues = JSON.stringify(record);
      } catch {
        // entity might not have a direct Prisma model accessor
      }
    }

    res.send = (body: any) => {
      res.send = originalSend;
      const success = res.statusCode < 400;
      if (success) {
        try {
          const parsed = typeof body === 'string' ? JSON.parse(body) : body;
          const newValues = parsed?.data ? JSON.stringify(parsed.data) : null;
          prisma.auditLog.create({
            data: {
              userId: req.user?.userId || null,
              action: `${req.method} ${req.path}`,
              entityName,
              entityId: entityId || parsed?.data?.id || null,
              oldValues,
              newValues,
              description: actionDescription || `${req.method} on ${entityName}`,
              ipAddress: req.ip || null,
            },
          }).catch((e) => logger.error('Audit log write failed', { error: e }));
        } catch {
          // ignore audit write failures
        }
      }
      return originalSend(body);
    };

    next();
  };
}
