import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/common/types';
import { successResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as service from './buses.service';

export const createBus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.createBus(req.body, req.user?.userId);
  res.status(201).json(successResponse(res, result, 'Bus created'));
});

export const listBuses = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listBuses({
    terminalId: req.query.terminalId as string,
    status: req.query.status as string,
    search: req.query.search as string,
  });
  res.status(200).json(successResponse(res, result, 'Buses retrieved'));
});

export const getBus = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getBusById(req.params.id);
  res.status(200).json(successResponse(res, result, 'Bus retrieved'));
});

export const updateBus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.updateBus(req.params.id, req.body);
  res.status(200).json(successResponse(res, result, 'Bus updated'));
});

export const updateMaintenance = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.updateMaintenanceStatus(req.params.id, req.body.status);
  res.status(200).json(successResponse(res, result, 'Maintenance status updated'));
});

export const deleteBus = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await service.deleteBus(req.params.id, req.user?.userId);
  res.status(200).json(successResponse(res, null, 'Bus deleted'));
});
