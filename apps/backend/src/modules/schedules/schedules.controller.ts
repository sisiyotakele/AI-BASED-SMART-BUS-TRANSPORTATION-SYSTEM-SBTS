import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/common/types';
import { successResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as service from './schedules.service';

export const createSchedule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.createSchedule(req.body, req.user?.userId);
  res.status(201).json(successResponse(res, result, 'Schedule created', 201));
});

export const listSchedules = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listSchedules({
    routeId: req.query.routeId as string,
    dayOfWeek: req.query.dayOfWeek as string,
  });
  res.status(200).json(successResponse(res, result, 'Schedules retrieved'));
});

export const getSchedule = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getScheduleById(req.params.id);
  res.status(200).json(successResponse(res, result, 'Schedule retrieved'));
});

export const updateSchedule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.updateSchedule(req.params.id, req.body);
  res.status(200).json(successResponse(res, result, 'Schedule updated'));
});

export const deleteSchedule = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await service.deleteSchedule(req.params.id, req.user?.userId);
  res.status(200).json(successResponse(res, null, 'Schedule deleted'));
});
