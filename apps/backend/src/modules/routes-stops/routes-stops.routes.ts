import { z } from 'zod';
import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import {
  createRouteSchema,
  updateRouteSchema,
  routeIdParamSchema,
  createStopSchema,
  updateStopSchema,
  stopIdParamSchema,
  addRouteStopSchema,
  nearbyQuerySchema,
} from './routes-stops.validation';
import {
  createRoute,
  listRoutes,
  getRoute,
  getRouteVersions,
  updateRoute,
  createNewVersion,
  deleteRoute,
  createStop,
  listStops,
  getStop,
  updateStop,
  deleteStop,
  nearbyStops,
  addRouteStop as addRouteStopController,
} from './routes-stops.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/routes-stops:
 *   get:
 *     summary: Get module info
 *     tags: [Routes & Stops]
 *     responses:
 *       200:
 *         description: Module information
 */
router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Routes & Stops module is running',
    endpoints: {
      routes: '/api/v1/routes-stops/routes',
      stops: '/api/v1/routes-stops/stops',
    },
  });
});

// =====================
// ROUTES ENDPOINTS
// =====================

/**
 * @swagger
 * /api/v1/routes-stops/routes:
 *   post:
 *     summary: Create a new route
 *     tags: [Routes & Stops]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - startTerminalId
 *               - endTerminalId
 *             properties:
 *               name:
 *                 type: string
 *               startTerminalId:
 *                 type: string
 *                 format: uuid
 *               endTerminalId:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Route created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       500:
 *         description: Internal server error
 */
router.post(
  '/routes',
  requirePermission('manage_routes'),
  validateBody(createRouteSchema),
  createRoute
);

/**
 * @swagger
 * /api/v1/routes-stops/routes:
 *   get:
 *     summary: List all routes
 *     tags: [Routes & Stops]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Routes retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       500:
 *         description: Internal server error
 */
router.get(
  '/routes',
  requirePermission('view_routes'),
  listRoutes
);

/**
 * @swagger
 * /api/v1/routes-stops/routes/{id}:
 *   get:
 *     summary: Get route details
 *     tags: [Routes & Stops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Route ID
 *     responses:
 *       200:
 *         description: Route retrieved successfully
 *       400:
 *         description: Invalid route ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Route not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/routes/:id',
  requirePermission('view_routes'),
  validateParams(routeIdParamSchema),
  getRoute
);

/**
 * @swagger
 * /api/v1/routes-stops/routes/{id}/versions:
 *   get:
 *     summary: Get all versions of a route
 *     tags: [Routes & Stops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Route ID
 *     responses:
 *       200:
 *         description: Route versions retrieved successfully
 *       400:
 *         description: Invalid route ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Route not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/routes/:id/versions',
  requirePermission('view_routes'),
  validateParams(routeIdParamSchema),
  getRouteVersions
);

/**
 * @swagger
 * /api/v1/routes-stops/routes/{id}:
 *   patch:
 *     summary: Update route details
 *     tags: [Routes & Stops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Route ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               startTerminalId:
 *                 type: string
 *                 format: uuid
 *               endTerminalId:
 *                 type: string
 *                 format: uuid
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Route updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Route not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/routes/:id',
  requirePermission('manage_routes'),
  validateParams(routeIdParamSchema),
  validateBody(updateRouteSchema),
  updateRoute
);

/**
 * @swagger
 * /api/v1/routes-stops/routes/{id}/versions:
 *   post:
 *     summary: Create a new version of a route
 *     tags: [Routes & Stops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Route ID
 *     responses:
 *       201:
 *         description: Route version created successfully
 *       400:
 *         description: Invalid route ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Route not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/routes/:id/versions',
  requirePermission('manage_routes'),
  validateParams(routeIdParamSchema),
  createNewVersion
);

/**
 * @swagger
 * /api/v1/routes-stops/routes/{id}:
 *   delete:
 *     summary: Delete a route
 *     tags: [Routes & Stops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Route ID
 *     responses:
 *       200:
 *         description: Route deleted successfully
 *       400:
 *         description: Invalid route ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Route not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/routes/:id',
  requirePermission('manage_routes'),
  validateParams(routeIdParamSchema),
  deleteRoute
);

// =====================
// STOPS ENDPOINTS
// =====================

/**
 * @swagger
 * /api/v1/routes-stops/stops:
 *   post:
 *     summary: Create a new stop
 *     tags: [Routes & Stops]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - latitude
 *               - longitude
 *             properties:
 *               name:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Stop created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       500:
 *         description: Internal server error
 */
router.post(
  '/stops',
  requirePermission('manage_routes'),
  validateBody(createStopSchema),
  createStop
);

/**
 * @swagger
 * /api/v1/routes-stops/stops:
 *   get:
 *     summary: List all stops
 *     tags: [Routes & Stops]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Stops retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       500:
 *         description: Internal server error
 */
router.get(
  '/stops',
  requirePermission('view_routes'),
  listStops
);

/**
 * @swagger
 * /api/v1/routes-stops/stops/nearby:
 *   get:
 *     summary: Find stops nearby a location
 *     tags: [Routes & Stops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude of the location
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude of the location
 *       - in: query
 *         name: radiusKm
 *         schema:
 *           type: number
 *           default: 1
 *         description: Search radius in kilometers
 *     responses:
 *       200:
 *         description: Nearby stops retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       500:
 *         description: Internal server error
 */
router.get(
  '/stops/nearby',
  requirePermission('view_routes'),
  validateQuery(nearbyQuerySchema),
  nearbyStops
);

/**
 * @swagger
 * /api/v1/routes-stops/stops/{id}:
 *   get:
 *     summary: Get stop details
 *     tags: [Routes & Stops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stop ID
 *     responses:
 *       200:
 *         description: Stop retrieved successfully
 *       400:
 *         description: Invalid stop ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Stop not found
 *       500:
 *         description: Internal server error
 */
router.get(
  '/stops/:id',
  requirePermission('view_routes'),
  validateParams(stopIdParamSchema),
  getStop
);

/**
 * @swagger
 * /api/v1/routes-stops/stops/{id}:
 *   patch:
 *     summary: Update stop details
 *     tags: [Routes & Stops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stop ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               address:
 *                 type: string
 *     responses:
 *       200:
 *         description: Stop updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Stop not found
 *       500:
 *         description: Internal server error
 */
router.patch(
  '/stops/:id',
  requirePermission('manage_routes'),
  validateParams(stopIdParamSchema),
  validateBody(updateStopSchema),
  updateStop
);

/**
 * @swagger
 * /api/v1/routes-stops/stops/{id}:
 *   delete:
 *     summary: Delete a stop
 *     tags: [Routes & Stops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Stop ID
 *     responses:
 *       200:
 *         description: Stop deleted successfully
 *       400:
 *         description: Invalid stop ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Stop not found
 *       500:
 *         description: Internal server error
 */
router.delete(
  '/stops/:id',
  requirePermission('manage_routes'),
  validateParams(stopIdParamSchema),
  deleteStop
);

// =====================
// ROUTE-STOPS ENDPOINTS
// =====================

/**
 * @swagger
 * /api/v1/routes-stops/route-versions/{versionId}/stops:
 *   post:
 *     summary: Add a stop to a route version
 *     tags: [Routes & Stops]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: versionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Route version ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - stopId
 *               - sequenceNumber
 *               - distanceFromPreviousKm
 *             properties:
 *               stopId:
 *                 type: string
 *                 format: uuid
 *               sequenceNumber:
 *                 type: integer
 *               distanceFromPreviousKm:
 *                 type: number
 *     responses:
 *       201:
 *         description: Stop added to route version successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Route version not found
 *       500:
 *         description: Internal server error
 */
router.post(
  '/route-versions/:versionId/stops',
  requirePermission('manage_routes'),
  validateParams(z.object({ versionId: z.string().uuid() })),
  validateBody(addRouteStopSchema),
  addRouteStopController
);

export default router;