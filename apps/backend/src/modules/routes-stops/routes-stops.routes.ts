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

// Module health/info endpoint
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

// Routes
router.post(
  '/routes',
  requirePermission('manage_routes'),
  validateBody(createRouteSchema),
  createRoute
);

router.get(
  '/routes',
  requirePermission('view_routes'),
  listRoutes
);

router.get(
  '/routes/:id',
  requirePermission('view_routes'),
  validateParams(routeIdParamSchema),
  getRoute
);

router.get(
  '/routes/:id/versions',
  requirePermission('view_routes'),
  validateParams(routeIdParamSchema),
  getRouteVersions
);

router.patch(
  '/routes/:id',
  requirePermission('manage_routes'),
  validateParams(routeIdParamSchema),
  validateBody(updateRouteSchema),
  updateRoute
);

router.post(
  '/routes/:id/versions',
  requirePermission('manage_routes'),
  validateParams(routeIdParamSchema),
  createNewVersion
);

router.delete(
  '/routes/:id',
  requirePermission('manage_routes'),
  validateParams(routeIdParamSchema),
  deleteRoute
);

// Stops
router.post(
  '/stops',
  requirePermission('manage_routes'),
  validateBody(createStopSchema),
  createStop
);

router.get(
  '/stops',
  requirePermission('view_routes'),
  listStops
);

router.get(
  '/stops/nearby',
  requirePermission('view_routes'),
  validateQuery(nearbyQuerySchema),
  nearbyStops
);

router.get(
  '/stops/:id',
  requirePermission('view_routes'),
  validateParams(stopIdParamSchema),
  getStop
);

router.patch(
  '/stops/:id',
  requirePermission('manage_routes'),
  validateParams(stopIdParamSchema),
  validateBody(updateStopSchema),
  updateStop
);

router.delete(
  '/stops/:id',
  requirePermission('manage_routes'),
  validateParams(stopIdParamSchema),
  deleteStop
);

// Route Stops (add to draft version)
router.post(
  '/route-versions/:versionId/stops',
  requirePermission('manage_routes'),
  validateParams(z.object({ versionId: z.string().uuid() })),
  validateBody(addRouteStopSchema),
  addRouteStopController
);

export default router;