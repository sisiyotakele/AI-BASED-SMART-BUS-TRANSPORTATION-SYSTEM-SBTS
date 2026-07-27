import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createScheduleSchema, updateScheduleSchema, scheduleIdParamSchema, scheduleQuerySchema } from './schedules.validation';
import { createSchedule, listSchedules, getSchedule, updateSchedule, deleteSchedule } from './schedules.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/schedules:
 *   post:
 *     summary: Create a new schedule
 *     tags: [Schedules]
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
 *               - versionId
 *               - departureTime
 *               - dayOfWeek
 *             properties:
 *               routeId:
 *                 type: string
 *                 format: uuid
 *               versionId:
 *                 type: string
 *                 format: uuid
 *               departureTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               dayOfWeek:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 6
 *               effectiveFrom:
 *                 type: string
 *                 format: date-time
 *               effectiveUntil:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Schedule created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post('/', requirePermission('manage_schedules'), validateBody(createScheduleSchema), createSchedule);

/**
 * @swagger
 * /api/v1/schedules:
 *   get:
 *     summary: List all schedules
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: routeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by route
 *       - in: query
 *         name: dayOfWeek
 *         schema:
 *           type: integer
 *           minimum: 0
 *           maximum: 6
 *         description: Filter by day of week (0=Sunday, 6=Saturday)
 *     responses:
 *       200:
 *         description: List of schedules
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/', requirePermission('view_schedules'), validateQuery(scheduleQuerySchema), listSchedules);

/**
 * @swagger
 * /api/v1/schedules/{id}:
 *   get:
 *     summary: Get schedule by ID
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Schedule ID
 *     responses:
 *       200:
 *         description: Schedule details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Server error
 */
router.get('/:id', requirePermission('view_schedules'), validateParams(scheduleIdParamSchema), getSchedule);

/**
 * @swagger
 * /api/v1/schedules/{id}:
 *   patch:
 *     summary: Update schedule
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Schedule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               departureTime:
 *                 type: string
 *               dayOfWeek:
 *                 type: integer
 *               effectiveFrom:
 *                 type: string
 *                 format: date-time
 *               effectiveUntil:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Server error
 */
router.patch('/:id', requirePermission('manage_schedules'), validateParams(scheduleIdParamSchema), validateBody(updateScheduleSchema), updateSchedule);

/**
 * @swagger
 * /api/v1/schedules/{id}:
 *   delete:
 *     summary: Delete schedule (soft delete)
 *     tags: [Schedules]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Schedule ID
 *     responses:
 *       200:
 *         description: Schedule deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Schedule not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', requirePermission('manage_schedules'), validateParams(scheduleIdParamSchema), deleteSchedule);

export default router;
