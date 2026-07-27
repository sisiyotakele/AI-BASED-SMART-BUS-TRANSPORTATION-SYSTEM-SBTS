import { Request, Response, NextFunction } from 'express';
import { auditService } from './audit.service';

export interface AuditRequest extends Request {
  user?: {
    id: string;
  };
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
    // Save the original res.json function
    const originalJson = res.json.bind(res);

    // Override res.json
    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        auditService
          .createAuditLog({
            userId: req.user?.id,
            action: options.action,
            entityName: options.entityName,
            entityId: options.getEntityId?.(req),
            description: options.getDescription?.(req),
            ipAddress: req.ip,
            oldValues: undefined,
            newValues: JSON.stringify(body),
          })
          .catch((err) => {
            console.error('Audit logging failed:', err);
          });
      }

      return originalJson(body);
    };

    next();
  };