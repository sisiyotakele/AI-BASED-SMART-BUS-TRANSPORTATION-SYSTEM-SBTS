// src/modules/pricing/pricing.controller.ts

import { Request, Response } from 'express';
import { pricingService } from './pricing.service';

export class PricingController {
  /**
   * GET /api/pricing
   * Get all prices with pagination and filters
   */
  async getAllPrices(req: Request, res: Response): Promise<void> {
    try {
      const { routeId, fromStopId, toStopId, isActive, page, limit } = req.query;

      const result = await pricingService.getAllPrices({
        routeId: routeId as string,
        fromStopId: fromStopId as string,
        toStopId: toStopId as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      res.status(200).json({
        success: true,
        message: 'Prices retrieved successfully',
        data: result.data,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch prices',
      });
    }
  }

  /**
   * GET /api/pricing/:id
   * Get price by ID
   */
  async getPriceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const price = await pricingService.getPriceById(id);

      if (!price) {
        res.status(404).json({
          success: false,
          message: 'Price not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: price,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch price',
      });
    }
  }

  /**
   * GET /api/pricing/route/:routeId
   * Get all prices for a specific route
   */
  async getPricesByRoute(req: Request, res: Response): Promise<void> {
    try {
      const { routeId } = req.params;
      const prices = await pricingService.getPricesByRoute(routeId);

      res.status(200).json({
        success: true,
        count: prices.length,
        data: prices,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch route prices',
      });
    }
  }

  /**
   * GET /api/pricing/calculate
   * Calculate price between two stops
   */
  async calculatePrice(req: Request, res: Response): Promise<void> {
    try {
      const { routeId, fromStopId, toStopId, isPeak } = req.query;

      if (!routeId || !fromStopId || !toStopId) {
        res.status(400).json({
          success: false,
          message: 'routeId, fromStopId and toStopId are required',
        });
        return;
      }

      const result = await pricingService.calculatePrice(
        routeId as string,
        fromStopId as string,
        toStopId as string,
        isPeak === 'true'
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Price calculation failed',
      });
    }
  }

  /**
   * GET /api/pricing/stats
   * Get price statistics
   */
  async getPriceStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await pricingService.getPriceStats();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to fetch statistics',
      });
    }
  }

  /**
   * POST /api/pricing
   * Create a new price
   */
  async createPrice(req: Request, res: Response): Promise<void> {
    try {
      const price = await pricingService.createPrice(req.body);

      res.status(201).json({
        success: true,
        message: 'Price created successfully',
        data: price,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create price';
      const status = this.getErrorStatus(message);

      res.status(status).json({
        success: false,
        message,
      });
    }
  }

  /**
   * PUT /api/pricing/:id
   * Update a price
   */
  async updatePrice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const price = await pricingService.updatePrice(id, req.body);

      res.status(200).json({
        success: true,
        message: 'Price updated successfully',
        data: price,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update price';
      const status = this.getErrorStatus(message);

      res.status(status).json({
        success: false,
        message,
      });
    }
  }

  /**
   * DELETE /api/pricing/:id
   * Soft delete a price
   */
  async deletePrice(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await pricingService.deletePrice(id);

      res.status(200).json({
        success: true,
        message: 'Price deleted successfully',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete price';
      const status = this.getErrorStatus(message);

      res.status(status).json({
        success: false,
        message,
      });
    }
  }

  /**
   * Get HTTP status code from error message
   * Case-insensitive matching
   */
  private getErrorStatus(message: string): number {
    const lower = message.toLowerCase();

    if (lower.includes('not found')) {
      return 404;
    }

    if (lower.includes('already exists')) {
      return 409;
    }

    if (lower.includes('required') || lower.includes('invalid') || lower.includes('must')) {
      return 400;
    }

    return 400;
  }
}

export const pricingController = new PricingController();
export default pricingController;