import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/common/types';
import { successResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as service from './shifts.service';

export const createShift = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.createShift(req.body, req.user?.userId);
  successResponse(res, result, 'Shift created', 201);
});

export const listShifts = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listShifts({
    driverId: req.query.driverId as string,
    date: req.query.date ? new Date(req.query.date as string) : undefined,
  });
  successResponse(res, result, 'Shifts retrieved');
});

export const getShift = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getShiftById(req.params.id);
  successResponse(res, result, 'Shift retrieved');
});

export const updateShift = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.updateShift(req.params.id, req.body);
  successResponse(res, result, 'Shift updated');
});

export const deleteShift = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await service.deleteShift(req.params.id, req.user?.userId);
  successResponse(res, null, 'Shift deleted');
});
