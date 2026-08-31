import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/common/types';
import { successResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as service from './dispatch.service';

export const generateTrips = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.body.date) {
    return res.status(400).json({ success: false, message: 'Date is required (YYYY-MM-DD)' });
  }
  const result = await service.generateTripsForDate(req.body.date);
  successResponse(res, result, 'Daily dispatch trip generation complete', 201);
});
