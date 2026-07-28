// src/modules/reporting/reporting.controller.ts

import { Request, Response } from 'express';
import { reportingService } from './reporting.service';
import { reportFilterSchema, ReportFilterDto } from './reporting.validation';

export class ReportingController {
  /**
   * GET /api/reports/dashboard
   * Get dashboard statistics
   */
  async dashboard(req: Request, res: Response): Promise<void> {
    try {
      const filters = this.validateFilters(req.query);
      const data = await reportingService.getDashboard(filters);

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch dashboard data');
    }
  }

  /**
   * GET /api/reports/trips
   * Get trip report with pagination
   */
  async trips(req: Request, res: Response): Promise<void> {
    try {
      const filters = this.validateFilters(req.query);
      const result = await reportingService.getTripReport(filters);

      res.status(200).json({
        success: true,
        data: result.data,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch trip report');
    }
  }

  /**
   * GET /api/reports/incidents
   * Get incident report with pagination
   */
  async incidents(req: Request, res: Response): Promise<void> {
    try {
      const filters = this.validateFilters(req.query);
      const result = await reportingService.getIncidentReport(filters);

      res.status(200).json({
        success: true,
        data: result.data,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch incident report');
    }
  }

  /**
   * GET /api/reports/buses
   * Get bus report with trip counts
   */
  async buses(req: Request, res: Response): Promise<void> {
    try {
      const data = await reportingService.getBusReport();

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch bus report');
    }
  }

  /**
   * GET /api/reports/drivers
   * Get driver report with trip counts
   */
  async drivers(req: Request, res: Response): Promise<void> {
    try {
      const data = await reportingService.getDriverReport();

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch driver report');
    }
  }

  /**
   * GET /api/reports/revenue
   * Get revenue report
   */
  async revenue(req: Request, res: Response): Promise<void> {
    try {
      const data = await reportingService.getRevenueReport();

      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      this.handleError(res, error, 'Failed to fetch revenue report');
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────

  /**
   * Validate and parse query filters using Zod schema
   */
  private validateFilters(query: any): ReportFilterDto {
    const result = reportFilterSchema.safeParse(query);

    if (!result.success) {
      throw new Error(`Invalid filters: ${result.error.message}`);
    }

    return result.data;
  }

  /**
   * Centralized error handler
   */
  private handleError(res: Response, error: unknown, defaultMessage: string): void {
    const message = error instanceof Error ? error.message : defaultMessage;
    const status = message.includes('Invalid filters') ? 400 : 500;

    res.status(status).json({
      success: false,
      message,
    });
  }
}

export const reportingController = new ReportingController();