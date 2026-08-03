import { Request, Response } from 'express';
import { successResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as service from './ai-integration.service';

export const healthCheck = asyncHandler(async (req: Request, res: Response) => {
    const health = await service.checkAIServiceHealth();
    return successResponse(res, health, 'AI Service is healthy');
});

export const predictTraffic = asyncHandler(async (req: Request, res: Response) => {
    const prediction = await service.predictTraffic(req.body);
    return successResponse(res, prediction, 'Traffic prediction successful');
});

export const predictETA = asyncHandler(async (req: Request, res: Response) => {
    const prediction = await service.predictETA(req.body);
    return successResponse(res, prediction, 'ETA prediction successful');
});

export const predictCombined = asyncHandler(async (req: Request, res: Response) => {
    const prediction = await service.predictCombined(req.body);
    return successResponse(res, prediction, 'Combined prediction successful');
});

export const predictBatch = asyncHandler(async (req: Request, res: Response) => {
    const prediction = await service.predictBatch(req.body.trips);
    return successResponse(res, prediction, 'Batch prediction successful');
});
