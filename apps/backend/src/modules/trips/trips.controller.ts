import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/common/types';
import { successResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as service from './trips.service';

export const createTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.createTrip(req.body, req.user?.userId);
  successResponse(res, result, 'Trip created', 201);
});

export const listTrips = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listTrips({
    driverId: req.query.driverId as string,
    status: req.query.status as string,
    busId: req.query.busId as string,
    date: req.query.date ? new Date(req.query.date as string) : undefined,
  });
  successResponse(res, result, 'Trips retrieved');
});

export const getTrip = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getTripById(req.params.id);
  successResponse(res, result, 'Trip retrieved');
});

export const startTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.startTrip(req.params.id);
  successResponse(res, result, 'Trip started');
});

export const pauseTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.pauseTrip(req.params.id);
  successResponse(res, result, 'Trip paused');
});

export const resumeTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.resumeTrip(req.params.id);
  successResponse(res, result, 'Trip resumed');
});

export const endTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.endTrip(req.params.id);
  successResponse(res, result, 'Trip completed');
});

export const cancelTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.cancelTrip(req.params.id);
  successResponse(res, result, 'Trip cancelled');
});

export const deleteTrip = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await service.deleteTrip(req.params.id, req.user?.userId);
  successResponse(res, null, 'Trip deleted');
});
