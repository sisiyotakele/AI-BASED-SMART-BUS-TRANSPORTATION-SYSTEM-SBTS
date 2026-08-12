import { Request, Response } from 'express';
import * as dashboardService from './dashboard.service';
import { asyncHandler } from '@/common/asyncHandler';
import { successResponse } from '@/common/response';

export const getStats = asyncHandler(async (req: Request, res: Response) => {
    const stats = await dashboardService.getStats();
    return successResponse(res, stats, 'Dashboard stats retrieved successfully');
});

export const getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
    const activity = await dashboardService.getRecentActivity();
    return successResponse(res, activity, 'Recent activity retrieved successfully');
});
