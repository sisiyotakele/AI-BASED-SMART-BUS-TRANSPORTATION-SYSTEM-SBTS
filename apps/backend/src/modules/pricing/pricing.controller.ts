// src/modules/pricing/pricing.controller.ts

import { Request, Response } from 'express';
import { successResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as service from './pricing.service';

/**
 * GET /api/v1/pricing
 * Get all prices with pagination and filters
 */
export const getAllPrices = asyncHandler(async (req: Request, res: Response) => {
  const { routeId, fromStopId, toStopId, isActive, page, limit } = req.query;

  const result = await service.getAllPrices({
    routeId: routeId as string,
    fromStopId: fromStopId as string,
    toStopId: toStopId as string,
    isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
  });

  return successResponse(
    res,
    {
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    },
    'Prices retrieved successfully'
  );
});

/**
 * GET /api/v1/pricing/:id
 * Get price by ID
 */
export const getPriceById = asyncHandler(async (req: Request, res: Response) => {
  const price = await service.getPriceById(req.params.id);
  return successResponse(res, price, 'Price retrieved successfully');
});

/**
 * GET /api/v1/pricing/route/:routeId
 * Get all prices for a specific route
 */
export const getPricesByRoute = asyncHandler(async (req: Request, res: Response) => {
  const prices = await service.getPricesByRoute(req.params.routeId);
  return successResponse(res, { count: prices.length, data: prices }, 'Route prices retrieved successfully');
});

/**
 * GET /api/v1/pricing/calculate
 * Calculate price between two stops
 */
export const calculatePrice = asyncHandler(async (req: Request, res: Response) => {
  const { routeId, fromStopId, toStopId, isPeak } = req.query;

  if (!routeId || !fromStopId || !toStopId) {
    return res.status(400).json({
      success: false,
      message: 'routeId, fromStopId and toStopId are required',
    });
  }

  const result = await service.calculatePrice(
    routeId as string,
    fromStopId as string,
    toStopId as string,
    isPeak === 'true'
  );

  return successResponse(res, result, 'Price calculated successfully');
});

/**
 * GET /api/v1/pricing/stats
 * Get price statistics
 */
export const getPriceStats = asyncHandler(async (req: Request, res: Response) => {
  const stats = await service.getPriceStats();
  return successResponse(res, stats, 'Statistics retrieved successfully');
});

/**
 * POST /api/v1/pricing
 * Create a new price
 */
export const createPrice = asyncHandler(async (req: Request, res: Response) => {
  const price = await service.createPrice(req.body);
  return successResponse(res, price, 'Price created successfully', 201);
});

/**
 * PATCH /api/v1/pricing/:id
 * Update a price
 */
export const updatePrice = asyncHandler(async (req: Request, res: Response) => {
  const price = await service.updatePrice(req.params.id, req.body);
  return successResponse(res, price, 'Price updated successfully');
});

/**
 * DELETE /api/v1/pricing/:id
 * Soft delete a price
 */
export const deletePrice = asyncHandler(async (req: Request, res: Response) => {
  await service.deletePrice(req.params.id);
  return successResponse(res, null, 'Price deleted successfully');
});
