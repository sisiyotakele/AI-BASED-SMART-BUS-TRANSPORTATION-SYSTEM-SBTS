import { Router } from 'express';
import { validateBody, validateParams } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';

import {
  createDriverSchema,
  updateDriverSchema,
  driverIdParamSchema,
} from './drivers.validation';

import {
  createDriver,
  listDrivers,
  getDriver,
  updateDriver,
  deleteDriver,
} from './drivers.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Create driver
router.post(
  '/',
  requirePermission('drivers:create'),
  validateBody(createDriverSchema),
  createDriver
);

// Get all drivers
router.get(
  '/',
  requirePermission('drivers:read'),
  listDrivers
);

// Get one driver
router.get(
  '/:id',
  requirePermission('drivers:read'),
  validateParams(driverIdParamSchema),
  getDriver
);

// Update driver
router.patch(
  '/:id',
  requirePermission('drivers:update'),
  validateParams(driverIdParamSchema),
  validateBody(updateDriverSchema),
  updateDriver
);

// Delete driver
router.delete(
  '/:id',
  requirePermission('drivers:delete'),
  validateParams(driverIdParamSchema),
  deleteDriver
);

export default router;