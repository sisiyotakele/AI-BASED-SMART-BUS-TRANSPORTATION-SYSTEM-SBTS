import { Request, Response } from 'express';
import * as dashboardService from './dashboard.service';
import { asyncHandler } from '@/common/asyncHandler';
import { successResponse } from '@/common/response';

export const getStats = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.id || (req as any).user?.userId || '';
    const stats = await dashboardService.getStats(userId);
    return successResponse(res, stats, 'Dashboard stats retrieved successfully');
});

export const getRecentActivity = asyncHandler(async (req: Request, res: Response) => {
    const activity = await dashboardService.getRecentActivity();
    return successResponse(res, activity, 'Recent activity retrieved successfully');
});
