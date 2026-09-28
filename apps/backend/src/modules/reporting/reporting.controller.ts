import { Request, Response } from 'express';
import { successResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as service from './reporting.service';

export const tripReport = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.generateTripReport({
    startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
    endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    routeId: req.query.routeId as string,
    driverId: req.query.driverId as string,
  });
  return successResponse(res, result, 'Trip report generated');
});

export const incidentReport = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.generateIncidentReport({
    startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
    endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
    severity: req.query.severity as string,
  });
  return successResponse(res, result, 'Incident report generated');
});

export const fleetReport = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.generateFleetReport();
  return successResponse(res, result, 'Fleet report generated');
});

export const getReports = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getReports({
    limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
    offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
  });
  return successResponse(res, result, 'Reports retrieved successfully');
});

export const getReportStats = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getReportStatistics();
  return successResponse(res, result, 'Report statistics retrieved successfully');
});

export const createReport = asyncHandler(async (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user?.id;
  const result = await service.createReport({
    ...req.body,
    createdBy: userId,
  });
  return successResponse(res, result, 'Report created successfully', 201);
});
