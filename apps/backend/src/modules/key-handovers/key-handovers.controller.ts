import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/common/types';
import { successResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as service from './key-handovers.service';

export const createHandover = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.createHandover(req.body, req.user?.userId);
  successResponse(res, result, 'Key handover created', 201);
});

export const listHandovers = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listHandovers({
    busId: req.query.busId as string,
    date: req.query.date ? new Date(req.query.date as string) : undefined,
  });
  successResponse(res, result, 'Key handovers retrieved');
});

export const getHandover = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getHandoverById(req.params.id);
  successResponse(res, result, 'Key handover retrieved');
});

export const confirmFrom = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.confirmFrom(req.params.id);
  successResponse(res, result, 'Outgoing driver confirmed');
});

export const confirmTo = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.confirmTo(req.params.id);
  successResponse(res, result, 'Incoming driver confirmed');
});
