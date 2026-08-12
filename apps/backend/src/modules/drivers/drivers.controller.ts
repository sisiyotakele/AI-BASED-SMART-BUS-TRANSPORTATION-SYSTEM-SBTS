import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/common/types';
import { successResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as service from './drivers.service';

export const createDriver = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.createDriver(req.body, req.user?.userId);
  return successResponse(res, result, 'Driver created', 201);
});

export const listDrivers = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listDrivers({
    terminalId: req.query.terminalId as string,
    search: req.query.search as string,
    isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
  });

  return successResponse(res, result, 'Drivers retrieved');
});

export const getDriver = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getDriverById(req.params.id);
  return successResponse(res, result, 'Driver retrieved');
});

export const updateDriver = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.updateDriver(req.params.id, req.body);
  return successResponse(res, result, 'Driver updated');
});

export const deleteDriver = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await service.deleteDriver(req.params.id, req.user?.userId);
  return successResponse(res, null, 'Driver deleted');
});