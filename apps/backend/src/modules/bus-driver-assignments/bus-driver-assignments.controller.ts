import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/common/types';
import { successResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as service from './bus-driver-assignments.service';

export const createAssignment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.createAssignment(req.body, req.user?.userId);
  successResponse(res, result, 'Assignment created', 201);
});

export const listAssignments = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listAssignments({
    date: req.query.date ? new Date(req.query.date as string) : undefined,
    busId: req.query.busId as string,
    shiftId: req.query.shiftId as string,
  });
  successResponse(res, result, 'Assignments retrieved');
});

export const getAssignment = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getAssignmentById(req.params.id);
  successResponse(res, result, 'Assignment retrieved');
});

export const updateAssignment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.updateAssignment(req.params.id, req.body);
  successResponse(res, result, 'Assignment updated');
});

export const deleteAssignment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await service.deleteAssignment(req.params.id, req.user?.userId);
  successResponse(res, null, 'Assignment deleted');
});
