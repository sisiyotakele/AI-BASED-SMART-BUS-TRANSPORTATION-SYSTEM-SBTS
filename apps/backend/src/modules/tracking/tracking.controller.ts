import { Request, Response } from 'express';
import { successResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as service from './tracking.service';

/**
 * Get current location of a specific bus
 */
export const getBusLocation = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getBusLocation(req.params.busId);
  successResponse(res, result, 'Bus location retrieved');
});

/**
 * Get locations of all active buses
 */
export const getAllBusLocations = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getAllActiveBusLocations();
  successResponse(res, result, 'Active bus locations retrieved');
});
