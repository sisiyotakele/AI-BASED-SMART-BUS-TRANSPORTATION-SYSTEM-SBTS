import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/common/types';
import { successResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as service from './schedules.service';

export const createSchedule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.createSchedule(req.body, req.user?.userId);
  return successResponse(res, result, 'Schedule created', 201);
});

export const listSchedules = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listSchedules({
    routeId: req.query.routeId as string,
    dayOfWeek: req.query.dayOfWeek as string,
  });
  return successResponse(res, result, 'Schedules retrieved');
});

export const getSchedule = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getScheduleById(req.params.id);
  return successResponse(res, result, 'Schedule retrieved');
});

export const updateSchedule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.updateSchedule(req.params.id, req.body);
  return successResponse(res, result, 'Schedule updated');
});

export const deleteSchedule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await service.deleteSchedule(req.params.id, req.user?.userId);
  return successResponse(res, null, 'Schedule deleted');
});
