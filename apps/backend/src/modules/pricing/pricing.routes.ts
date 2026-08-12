// src/modules/pricing/pricing.routes.ts

import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import {
  createPriceSchema,
  updatePriceSchema,
  priceIdParamSchema,
  routeIdParamSchema,
  calculatePriceQuerySchema,
  priceFiltersQuerySchema
} from './pricing.validation';
import {
  createPrice,
  getAllPrices,
  getPriceById,
  updatePrice,
  deletePrice,
  getPricesByRoute,
  calculatePrice,
  getPriceStats
} from './pricing.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/pricing:
 *   get:
 *     summary: Get all prices with pagination and filters
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: routeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by route ID
 *       - in: query
 *         name: fromStopId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by from stop ID
 *       - in: query
 *         name: toStopId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by to stop ID
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter by active status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Prices retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  requirePermission('view_pricing'),
  validateQuery(priceFiltersQuerySchema),
  getAllPrices
);

/**
 * @swagger
 * /api/v1/pricing/stats:
 *   get:
 *     summary: Get price statistics
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get(
  '/stats',
  requirePermission('view_pricing'),
  getPriceStats
);

/**
 * @swagger
 * /api/v1/pricing/calculate:
 *   get:
 *     summary: Calculate price between two stops
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Route ID
 *       - in: query
 *         name: fromStopId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: From stop ID
 *       - in: query
 *         name: toStopId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: To stop ID
 *       - in: query
 *         name: isPeak
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Whether it's peak time
 *     responses:
 *       200:
 *         description: Price calculated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: No active price found
 *       500:
 *         description: Server error
 */
router.get(
  '/calculate',
  requirePermission('view_pricing'),
  validateQuery(calculatePriceQuerySchema),
  calculatePrice
);

/**
 * @swagger
 * /api/v1/pricing/route/{routeId}:
 *   get:
 *     summary: Get all prices for a specific route
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Route ID
 *     responses:
 *       200:
 *         description: Route prices retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get(
  '/route/:routeId',
  requirePermission('view_pricing'),
  validateParams(routeIdParamSchema),
  getPricesByRoute
);

/**
 * @swagger
 * /api/v1/pricing/{id}:
 *   get:
 *     summary: Get price by ID
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Price ID
 *     responses:
 *       200:
 *         description: Price retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Price not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:id',
  requirePermission('view_pricing'),
  validateParams(priceIdParamSchema),
  getPriceById
);

/**
 * @swagger
 * /api/v1/pricing:
 *   post:
 *     summary: Create a new price
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - routeId
 *               - fromStopId
 *               - toStopId
 *               - basePrice
 *             properties:
 *               routeId:
 *                 type: string
 *                 format: uuid
 *               fromStopId:
 *                 type: string
 *                 format: uuid
 *               toStopId:
 *                 type: string
 *                 format: uuid
 *               basePrice:
 *                 type: number
 *                 format: double
 *                 minimum: 0.01
 *               peakPrice:
 *                 type: number
 *                 format: double
 *                 minimum: 0.01
 *               offPeakPrice:
 *                 type: number
 *                 format: double
 *                 minimum: 0.01
 *               effectiveFrom:
 *                 type: string
 *                 format: date-time
 *               effectiveUntil:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Price created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Price already exists for this route segment
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  requirePermission('manage_pricing'),
  validateBody(createPriceSchema),
  createPrice
);

/**
 * @swagger
 * /api/v1/pricing/{id}:
 *   patch:
 *     summary: Update a price
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Price ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               routeId:
 *                 type: string
 *                 format: uuid
 *               fromStopId:
 *                 type: string
 *                 format: uuid
 *               toStopId:
 *                 type: string
 *                 format: uuid
 *               basePrice:
 *                 type: number
 *                 format: double
 *                 minimum: 0.01
 *               peakPrice:
 *                 type: number
 *                 format: double
 *                 minimum: 0.01
 *               offPeakPrice:
 *                 type: number
 *                 format: double
 *                 minimum: 0.01
 *               effectiveFrom:
 *                 type: string
 *                 format: date-time
 *               effectiveUntil:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Price updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Price not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/:id',
  requirePermission('manage_pricing'),
  validateParams(priceIdParamSchema),
  validateBody(updatePriceSchema),
  updatePrice
);

/**
 * @swagger
 * /api/v1/pricing/{id}:
 *   delete:
 *     summary: Delete a price (soft delete)
 *     tags: [Pricing]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Price ID
 *     responses:
 *       200:
 *         description: Price deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Price not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id',
  requirePermission('manage_pricing'),
  validateParams(priceIdParamSchema),
  deletePrice
);

export default router;
