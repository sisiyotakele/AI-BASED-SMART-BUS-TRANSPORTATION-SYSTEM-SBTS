import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/common/types';
import { successResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as service from './incidents.service';

export const createIncident = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.createIncident(req.body, req.user?.userId);
  successResponse(res, result, 'Incident reported', 201);
});

export const listIncidents = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listIncidents({
    status: req.query.status as string,
    tripId: req.query.tripId as string,
    driverId: req.query.driverId as string,
  });
  successResponse(res, result, 'Incidents retrieved');
});

export const getIncident = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getIncidentById(req.params.id);
  successResponse(res, result, 'Incident retrieved');
});

export const reviewIncident = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.reviewIncident(req.params.id);
  successResponse(res, result, 'Incident under review');
});

export const resolveIncident = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.resolveIncident(req.params.id, req.body, req.user?.userId);
  successResponse(res, result, 'Incident resolved');
});

export const deleteIncident = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await service.deleteIncident(req.params.id, req.user?.userId);
  successResponse(res, null, 'Incident deleted');
});
