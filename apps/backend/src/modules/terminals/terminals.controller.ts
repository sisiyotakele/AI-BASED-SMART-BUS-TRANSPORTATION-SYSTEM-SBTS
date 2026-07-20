import { Request, Response } from 'express';
import { AuthenticatedRequest } from '@/common/types';
import { successResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as service from './terminals.service';

export const createTerminal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.createTerminal(req.body, req.user?.userId);
  res.status(201).json(successResponse(result, 'Terminal created'));
});

export const listTerminals = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.listTerminals(req.query.search as string);
  res.status(200).json(successResponse(result, 'Terminals retrieved'));
});

export const getTerminal = asyncHandler(async (req: Request, res: Response) => {
  const result = await service.getTerminalById(req.params.id);
  res.status(200).json(successResponse(result, 'Terminal retrieved'));
});

export const updateTerminal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const result = await service.updateTerminal(req.params.id, req.body);
  res.status(200).json(successResponse(result, 'Terminal updated'));
});

export const deleteTerminal = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await service.deleteTerminal(req.params.id, req.user?.userId);
  res.status(200).json(successResponse(null, 'Terminal deleted'));
});
