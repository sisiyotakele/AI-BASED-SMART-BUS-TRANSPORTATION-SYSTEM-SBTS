// src/modules/pricing/pricing.routes.ts

import { Router } from 'express';
import { pricingController } from './pricing.controller';
import { pricingMiddleware } from './pricing.middleware';

const router = Router();

/**
 * ============================================================
 * Pricing Routes
 * Base URL: /api/v1/pricing
 * ============================================================
 */

// Get all prices
router.get(
  '/',
  pricingController.getAllPrices.bind(pricingController),
);

// Price statistics
router.get(
  '/stats',
  pricingController.getPriceStats.bind(pricingController),
);

// Calculate fare
router.get(
  '/calculate',
  pricingController.calculatePrice.bind(pricingController),
);

// Prices for a specific route
router.get(
  '/route/:routeId',
  pricingController.getPricesByRoute.bind(pricingController),
);

// Get single price
router.get(
  '/:id',
  pricingController.getPriceById.bind(pricingController),
);



// Soft delete price
router.delete(
  '/:id',
  pricingController.deletePrice.bind(pricingController),
);
router.post(
  '/',
  pricingMiddleware.validatePrice.bind(pricingMiddleware),
  pricingController.createPrice.bind(pricingController),
);

router.put(
  '/:id',
  pricingMiddleware.validatePrice.bind(pricingMiddleware),
  pricingController.updatePrice.bind(pricingController),
);

export const pricingRoutes = router;
export default router;