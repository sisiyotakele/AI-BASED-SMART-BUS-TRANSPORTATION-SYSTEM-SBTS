import { Request, Response } from 'express';
import { auditService } from './audit.service';

class AuditController {
  async getAllAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const logs = await auditService.getAllAuditLogs();

      res.status(200).json({
        success: true,
        count: logs.length,
        data: logs,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs',
        error,
      });
    }
  }

  async getAuditLogById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const log = await auditService.getAuditLogById(id);

      if (!log) {
        res.status(404).json({
          success: false,
          message: 'Audit log not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: log,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit log',
        error,
      });
    }
  }

  async getAuditLogsByUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const logs = await auditService.getAuditLogsByUser(userId);

      res.status(200).json({
        success: true,
        count: logs.length,
        data: logs,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch user audit logs',
        error,
      });
    }
  }

  async getAuditLogsByEntity(req: Request, res: Response): Promise<void> {
    try {
      const { entityName } = req.params;
      const { entityId } = req.query;

      const logs = await auditService.getAuditLogsByEntity(
        entityName,
        entityId as string | undefined,
      );

      res.status(200).json({
        success: true,
        count: logs.length,
        data: logs,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch entity audit logs',
        error,
      });
    }
  }

  async searchAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const { userId, action, entityName } = req.query;

      const logs = await auditService.searchAuditLogs({
        userId: userId as string,
        action: action as string,
        entityName: entityName as string,
      });

      res.status(200).json({
        success: true,
        count: logs.length,
        data: logs,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Search failed',
        error,
      });
    }
  }
}

export const auditController = new AuditController();
export default auditController;