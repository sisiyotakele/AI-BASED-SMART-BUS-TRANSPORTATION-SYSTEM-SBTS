import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/common/types';
import { successResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as service from './routes-stops.service';

// Routes
export const createRoute = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.createRoute(req.body, req.user?.userId);
  successResponse(res, result, 'Route created', 201);
});

export const listRoutes = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listRoutes(req.query.search as string);
  successResponse(res, result, 'Routes retrieved');
});

export const getRoute = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getRouteById(req.params.id);
  successResponse(res, result, 'Route retrieved');
});

export const getRouteVersions = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getRouteVersions(req.params.id);
  successResponse(res, result, 'Route versions retrieved');
});

export const updateRoute = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.updateRoute(req.params.id, req.body);
  successResponse(res, result, 'Route updated');
});

export const createNewVersion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.createNewRouteVersion(req.params.id, req.body, req.user?.userId);
  successResponse(res, result, 'New route version created', 201);
});

export const deleteRoute = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await service.deleteRoute(req.params.id, req.user?.userId);
  successResponse(res, null, 'Route deleted');
});

// Stops
export const createStop = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.createStop(req.body, req.user?.userId);
  successResponse(res, result, 'Stop created', 201);
});

export const listStops = asyncHandler(async (req: Request, res: Response) => {
  const search = req.query.search as string;
  const terminalId = req.query.terminalId as string;
  const result = await service.listStops(search, terminalId);
  successResponse(res, result, 'Stops retrieved');
});

export const getStop = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getStopById(req.params.id);
  successResponse(res, result, 'Stop retrieved');
});

export const updateStop = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.updateStop(req.params.id, req.body);
  successResponse(res, result, 'Stop updated');
});

export const deleteStop = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await service.deleteStop(req.params.id, req.user?.userId);
  successResponse(res, null, 'Stop deleted');
});

export const nearbyStops = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.findNearbyStops(
    Number(req.query.lat),
    Number(req.query.lng),
    Number(req.query.radius)
  );
  successResponse(res, result, 'Nearby stops retrieved');
});

// Route Stops
export const addRouteStop = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.addRouteStop(req.params.versionId, req.body);
  successResponse(res, result, 'Route stop added', 201);
});

export const overwriteVersionStops = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.overwriteVersionStops(req.params.versionId, req.body);
  successResponse(res, result, 'Route stops overwritten', 200);
});

export const deleteRouteVersion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await service.deleteRouteVersion(req.params.versionId, req.user?.userId);
  successResponse(res, null, 'Route version deleted');
});

export const activateRouteVersion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await service.toggleRouteVersionStatus(req.params.versionId, true, req.user?.userId);
  successResponse(res, null, 'Route version activated');
});

export const deactivateRouteVersion = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await service.toggleRouteVersionStatus(req.params.versionId, false, req.user?.userId);
  successResponse(res, null, 'Route version deactivated');
});
