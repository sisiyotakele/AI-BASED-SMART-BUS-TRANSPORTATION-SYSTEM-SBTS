import { Request, Response, NextFunction } from 'express';
import * as auditService from './audit.service';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuditRequest extends Request {
  user?: any;
}

interface AuditOptions {
  action: string;
  entityName: string;
  getEntityId?: (req: Request) => string | undefined;
  getDescription?: (req: Request) => string;
}

export const auditMiddleware =
  (options: AuditOptions) =>
    async (req: AuditRequest, res: Response, next: NextFunction) => {
      // Capture userId immediately in the middleware scope.
      const userId = req.user?.id || (req as any).user?.userId || req.user?.sub;

      const entityId = options.getEntityId?.(req) || req.params.id || req.body?.id;
      let oldValues: any = undefined;

      // Capture oldValues if it's an update or delete
      if (req.method !== 'POST' && entityId && options.entityName) {
        try {
          const modelName = options.entityName.charAt(0).toLowerCase() + options.entityName.slice(1);
          if ((prisma as any)[modelName]) {
            oldValues = await (prisma as any)[modelName].findUnique({ where: { id: entityId } });
          }
        } catch (e) {
          // ignore
        }
      }

      // Save the original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json
      res.json = function (body: any) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          
          // Extract just the core entity data, removing success/message HTTP envelope
          const rawData = body?.data ? body.data : body;
          
          auditService
            .createAuditLog({
              userId: userId,
              action: options.action,
              entityName: options.entityName,
              entityId: entityId || (rawData?.id),
              description: options.getDescription?.(req),
              ipAddress: req.ip,
              oldValues: oldValues,
              newValues: rawData || null,
            })
            .catch((err: any) => {
              console.error('Audit logging failed:', err);
            });
        }

        return originalJson(body);
      };

      next();
    };