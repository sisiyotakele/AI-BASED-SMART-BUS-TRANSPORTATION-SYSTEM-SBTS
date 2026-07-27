import { Request, Response } from 'express';
import { successResponse, errorResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as auditService from './audit.service';

export const getAllAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const logs = await auditService.getAllAuditLogs();
  successResponse(res, logs, 'Audit logs retrieved successfully');
});

export const getAuditLogById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const log = await auditService.getAuditLogById(id);

  if (!log) {
    return res.status(404).json(errorResponse('Audit log not found', 'AUDIT_LOG_NOT_FOUND'));
  }

  successResponse(res, log, 'Audit log retrieved successfully');
});

export const getAuditLogsByUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const logs = await auditService.getAuditLogsByUser(userId);
  successResponse(res, logs, 'User audit logs retrieved successfully');
});

export const getAuditLogsByEntity = asyncHandler(async (req: Request, res: Response) => {
  const { entityName } = req.params;
  const { entityId } = req.query;

  const logs = await auditService.getAuditLogsByEntity(
    entityName,
    entityId as string | undefined
  );

  successResponse(res, logs, 'Entity audit logs retrieved successfully');
});

export const searchAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const { userId, action, entityName } = req.query;

  const logs = await auditService.searchAuditLogs({
    userId: userId as string,
    action: action as string,
    entityName: entityName as string,
  });

  successResponse(res, logs, 'Audit logs search completed');
});
