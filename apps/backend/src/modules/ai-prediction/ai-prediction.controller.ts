import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/common/types';
import { successResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as service from './ai-prediction.service';

export const createModel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.createModel(req.body);
  successResponse(res, result, 'AI model registered', 201);
});

export const listModels = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listModels();
  successResponse(res, result, 'AI models retrieved');
});

export const getActiveModel = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getActiveModel();
  successResponse(res, result, 'Active AI model retrieved');
});

export const activateModel = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.activateModel(req.params.id);
  successResponse(res, result, 'AI model activated');
});

export const getPrediction = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getPrediction(
    req.query.routeId as string,
    req.query.versionId as string | undefined,
    new Date(req.query.time as string)
  );
  successResponse(res, result, 'Prediction retrieved');
});

export const createPrediction = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.createPrediction(req.body);
  successResponse(res, result, 'Prediction created', 201);
});
