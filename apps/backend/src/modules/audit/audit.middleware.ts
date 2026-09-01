import { Request, Response, NextFunction } from 'express';
import * as auditService from './audit.service';

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
      console.log('AUDIT LOG INTERCEPT: captured userId =', userId, 'from req.user =', req.user);

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
              entityId: options.getEntityId?.(req),
              description: options.getDescription?.(req),
              ipAddress: req.ip,
              oldValues: undefined,
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