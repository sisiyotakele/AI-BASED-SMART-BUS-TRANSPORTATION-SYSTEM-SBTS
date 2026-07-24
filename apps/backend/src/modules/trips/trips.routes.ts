import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createTripSchema, tripIdParamSchema, tripQuerySchema } from './trips.validation';
import { createTrip, listTrips, getTrip, startTrip, pauseTrip, resumeTrip, endTrip, cancelTrip, deleteTrip } from './trips.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

router.post('/', requirePermission('create_trip'), validateBody(createTripSchema), createTrip);
router.get('/', requirePermission('view_trips'), validateQuery(tripQuerySchema), listTrips);
router.get('/:id', requirePermission('view_trips'), validateParams(tripIdParamSchema), getTrip);
router.patch('/:id/start', requirePermission('start_trip'), validateParams(tripIdParamSchema), startTrip);
router.patch('/:id/pause', requirePermission('start_trip'), validateParams(tripIdParamSchema), pauseTrip);
router.patch('/:id/resume', requirePermission('start_trip'), validateParams(tripIdParamSchema), resumeTrip);
router.patch('/:id/end', requirePermission('end_trip'), validateParams(tripIdParamSchema), endTrip);
router.patch('/:id/cancel', requirePermission('cancel_trip'), validateParams(tripIdParamSchema), cancelTrip);
router.delete('/:id', requirePermission('cancel_trip'), validateParams(tripIdParamSchema), deleteTrip);

export default router;
