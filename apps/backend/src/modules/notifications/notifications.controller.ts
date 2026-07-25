import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/common/types';
import { successResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as service from './notifications.service';

export const createNotification = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.createNotification(req.body, req.user?.userId);
  successResponse(res, result, 'Notification created', 201);
});

export const listNotifications = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.listNotifications(
    req.user!.userId,
    req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined
  );
  successResponse(res, result, 'Notifications retrieved');
});

export const markAsRead = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.markAsRead(req.params.id, req.user!.userId);
  successResponse(res, result, 'Notification marked as read');
});
