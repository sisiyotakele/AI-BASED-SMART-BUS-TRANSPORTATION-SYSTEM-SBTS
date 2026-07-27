import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/common/types';
import { successResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as service from './bus-route-assignments.service';

export const createAssignment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.createAssignment(req.body, req.user?.userId);
  successResponse(res, result, 'Assignment created', 201);
});

export const listAssignments = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listAssignments({ busId: req.query.busId as string });
  successResponse(res, result, 'Assignments retrieved');
});

export const getAssignment = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getAssignmentById(req.params.id);
  successResponse(res, result, 'Assignment retrieved');
});

export const deactivateAssignment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.deactivateAssignment(req.params.id, req.body.endDate ? { endDate: new Date(req.body.endDate) } : undefined);
  successResponse(res, result, 'Assignment deactivated');
});

export const deleteAssignment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await service.deleteAssignment(req.params.id, req.user?.userId);
  successResponse(res, null, 'Assignment deleted');
});
