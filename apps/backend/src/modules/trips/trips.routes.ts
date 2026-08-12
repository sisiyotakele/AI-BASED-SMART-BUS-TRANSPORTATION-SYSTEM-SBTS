import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createTripSchema, tripIdParamSchema, tripQuerySchema } from './trips.validation';
import { createTrip, listTrips, getTrip, startTrip, pauseTrip, resumeTrip, endTrip, cancelTrip, deleteTrip } from './trips.controller';
import { auditMiddleware } from '@/modules/audit';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/trips:
 *   post:
 *     summary: Create a new trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - busId
 *               - driverId
 *               - versionId
 *               - scheduleId
 *               - scheduledStart
 *               - scheduledEnd
 *             properties:
 *               busId:
 *                 type: string
 *                 format: uuid
 *               driverId:
 *                 type: string
 *                 format: uuid
 *               versionId:
 *                 type: string
 *                 format: uuid
 *               scheduleId:
 *                 type: string
 *                 format: uuid
 *               scheduledStart:
 *                 type: string
 *                 format: date-time
 *               scheduledEnd:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Trip created successfully
 *       400:
 *         description: Validation error or double booking
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post(
  '/', 
  requirePermission('create_trip'), 
  validateBody(createTripSchema), 
  auditMiddleware({
    action: 'CREATE',
    entityName: 'Trip',
    getDescription: () => `Created a new trip assignment`
  }),
  createTrip
);

/**
 * @swagger
 * /api/v1/trips:
 *   get:
 *     summary: List all trips
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: busId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by bus
 *       - in: query
 *         name: driverId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by driver
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, in_progress, paused, completed, cancelled]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of trips
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/', requirePermission('view_trips'), validateQuery(tripQuerySchema), listTrips);

/**
 * @swagger
 * /api/v1/trips/{id}:
 *   get:
 *     summary: Get trip by ID
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Trip details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Server error
 */
router.get('/:id', requirePermission('view_trips'), validateParams(tripIdParamSchema), getTrip);

/**
 * @swagger
 * /api/v1/trips/{id}/start:
 *   patch:
 *     summary: Start trip (change status to in_progress)
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Trip started successfully
 *       400:
 *         description: Invalid state transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/:id/start', 
  requirePermission('start_trip'), 
  validateParams(tripIdParamSchema), 
  auditMiddleware({
    action: 'UPDATE',
    entityName: 'Trip',
    getEntityId: (req) => req.params.id,
    getDescription: () => `Started trip execution`
  }),
  startTrip
);

/**
 * @swagger
 * /api/v1/trips/{id}/pause:
 *   patch:
 *     summary: Pause trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Trip paused successfully
 *       400:
 *         description: Invalid state transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/:id/pause', 
  requirePermission('start_trip'), 
  validateParams(tripIdParamSchema), 
  auditMiddleware({
    action: 'UPDATE',
    entityName: 'Trip',
    getEntityId: (req) => req.params.id,
    getDescription: () => `Paused trip execution`
  }),
  pauseTrip
);

/**
 * @swagger
 * /api/v1/trips/{id}/resume:
 *   patch:
 *     summary: Resume paused trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Trip resumed successfully
 *       400:
 *         description: Invalid state transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/:id/resume', 
  requirePermission('start_trip'), 
  validateParams(tripIdParamSchema), 
  auditMiddleware({
    action: 'UPDATE',
    entityName: 'Trip',
    getEntityId: (req) => req.params.id,
    getDescription: () => `Resumed paused trip`
  }),
  resumeTrip
);

/**
 * @swagger
 * /api/v1/trips/{id}/end:
 *   patch:
 *     summary: End trip (change status to completed)
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Trip ended successfully
 *       400:
 *         description: Invalid state transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/:id/end', 
  requirePermission('end_trip'), 
  validateParams(tripIdParamSchema), 
  auditMiddleware({
    action: 'UPDATE',
    entityName: 'Trip',
    getEntityId: (req) => req.params.id,
    getDescription: () => `Ended and completed trip`
  }),
  endTrip
);

/**
 * @swagger
 * /api/v1/trips/{id}/cancel:
 *   patch:
 *     summary: Cancel trip
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Trip cancelled successfully
 *       400:
 *         description: Invalid state transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/:id/cancel', 
  requirePermission('cancel_trip'), 
  validateParams(tripIdParamSchema), 
  auditMiddleware({
    action: 'UPDATE',
    entityName: 'Trip',
    getEntityId: (req) => req.params.id,
    getDescription: () => `Cancelled trip schedule`
  }),
  cancelTrip
);

/**
 * @swagger
 * /api/v1/trips/{id}:
 *   delete:
 *     summary: Delete trip (soft delete)
 *     tags: [Trips]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Trip ID
 *     responses:
 *       200:
 *         description: Trip deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Trip not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id', 
  requirePermission('cancel_trip'), 
  validateParams(tripIdParamSchema), 
  auditMiddleware({
    action: 'DELETE',
    entityName: 'Trip',
    getEntityId: (req) => req.params.id,
    getDescription: () => `Deleted trip record`
  }),
  deleteTrip
);

export default router;
