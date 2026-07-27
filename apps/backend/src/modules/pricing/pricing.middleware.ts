// src/modules/pricing/pricing.middleware.ts

import { Request, Response, NextFunction } from 'express';

class PricingMiddleware {
  /**
   * Validate price creation/update request
   */
  validatePrice(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const {
      routeId,
      fromStopId,
      toStopId,
      basePrice,
    } = req.body;

    // POST validation
    if (req.method === 'POST') {
      if (!routeId || !fromStopId || !toStopId) {
        res.status(400).json({
          success: false,
          message:
            'routeId, fromStopId and toStopId are required.',
        });
        return;
      }

      if (basePrice === undefined || Number(basePrice) <= 0) {
        res.status(400).json({
          success: false,
          message: 'basePrice must be greater than 0.',
        });
        return;
      }
    }

    // PUT validation
    if (
      basePrice !== undefined &&
      Number(basePrice) <= 0
    ) {
      res.status(400).json({
        success: false,
        message: 'basePrice must be greater than 0.',
      });
      return;
    }

    next();
  }
}

export const pricingMiddleware = new PricingMiddleware();
export default pricingMiddleware;