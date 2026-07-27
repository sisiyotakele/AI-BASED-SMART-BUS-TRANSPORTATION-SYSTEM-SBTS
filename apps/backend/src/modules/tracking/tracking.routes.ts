import { Router } from 'express';
import { validateParams } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { busIdParamSchema } from './tracking.validation';
import { getBusLocation, getAllBusLocations } from './tracking.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/tracking:
 *   get:
 *     summary: Get all active bus locations
 *     tags: [Tracking]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active bus locations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       busId:
 *                         type: string
 *                         format: uuid
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                       speed:
 *                         type: number
 *                       heading:
 *                         type: number
 *                       timestamp:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       500:
 *         description: Internal server error
 */
router.get('/', requirePermission('view_tracking'), getAllBusLocations);

/**
 * @swagger
 * /api/v1/tracking/{busId}:
 *   get:
 *     summary: Get specific bus location
 *     tags: [Tracking]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: busId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Bus ID
 *     responses:
 *       200:
 *         description: Bus location retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     busId:
 *                       type: string
 *                       format: uuid
 *                     latitude:
 *                       type: number
 *                     longitude:
 *                       type: number
 *                     speed:
 *                       type: number
 *                     heading:
 *                       type: number
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid bus ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Bus location not found
 *       500:
 *         description: Internal server error
 */
router.get('/:busId', requirePermission('view_tracking'), validateParams(busIdParamSchema), getBusLocation);

export { router as trackingRoutes };
