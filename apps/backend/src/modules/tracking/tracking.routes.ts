import { Router } from 'express';
import { validateParams } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { busIdParamSchema } from './tracking.validation';
import { getBusLocation, getAllBusLocations } from './tracking.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// Get all active bus locations
router.get('/', requirePermission('view_tracking'), getAllBusLocations);

// Get specific bus location
router.get('/:busId', requirePermission('view_tracking'), validateParams(busIdParamSchema), getBusLocation);

export { router as trackingRoutes };
