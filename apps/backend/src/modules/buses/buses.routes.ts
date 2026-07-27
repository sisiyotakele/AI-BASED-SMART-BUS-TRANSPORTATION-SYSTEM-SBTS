import { z } from 'zod';
import { Router } from 'express';
import { validateBody, validateParams } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createBusSchema, updateBusSchema, busIdParamSchema } from './buses.validation';
import { createBus, listBuses, getBus, updateBus, updateMaintenance, deleteBus } from './buses.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/buses:
 *   post:
 *     summary: Create a new bus
 *     tags: [Buses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - plateNumber
 *               - terminalId
 *             properties:
 *               plateNumber:
 *                 type: string
 *               model:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               terminalId:
 *                 type: string
 *                 format: uuid
 *               maintenanceStatus:
 *                 type: string
 *                 enum: [operational, in_maintenance, retired]
 *     responses:
 *       201:
 *         description: Bus created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Plate number already exists
 *       500:
 *         description: Server error
 */
router.post('/', requirePermission('manage_fleet'), validateBody(createBusSchema), createBus);

/**
 * @swagger
 * /api/v1/buses:
 *   get:
 *     summary: List all buses
 *     tags: [Buses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: terminalId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by terminal
 *       - in: query
 *         name: maintenanceStatus
 *         schema:
 *           type: string
 *           enum: [operational, in_maintenance, retired]
 *         description: Filter by maintenance status
 *     responses:
 *       200:
 *         description: List of buses
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/', requirePermission('view_fleet'), listBuses);

/**
 * @swagger
 * /api/v1/buses/{id}:
 *   get:
 *     summary: Get bus by ID
 *     tags: [Buses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Bus ID
 *     responses:
 *       200:
 *         description: Bus details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Bus not found
 *       500:
 *         description: Server error
 */
router.get('/:id', requirePermission('view_fleet'), validateParams(busIdParamSchema), getBus);

/**
 * @swagger
 * /api/v1/buses/{id}:
 *   patch:
 *     summary: Update bus
 *     tags: [Buses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Bus ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               model:
 *                 type: string
 *               capacity:
 *                 type: integer
 *               terminalId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Bus updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Bus not found
 *       500:
 *         description: Server error
 */
router.patch('/:id', requirePermission('manage_fleet'), validateParams(busIdParamSchema), validateBody(updateBusSchema), updateBus);

/**
 * @swagger
 * /api/v1/buses/{id}/maintenance-status:
 *   patch:
 *     summary: Update bus maintenance status
 *     tags: [Buses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Bus ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [operational, in_maintenance, retired]
 *     responses:
 *       200:
 *         description: Maintenance status updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Bus not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/maintenance-status', requirePermission('manage_fleet'), validateParams(busIdParamSchema), validateBody(z.object({ status: z.enum(['operational', 'in_maintenance', 'retired']) })), updateMaintenance);

/**
 * @swagger
 * /api/v1/buses/{id}:
 *   delete:
 *     summary: Delete bus (soft delete)
 *     tags: [Buses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Bus ID
 *     responses:
 *       200:
 *         description: Bus deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Bus not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', requirePermission('manage_fleet'), validateParams(busIdParamSchema), deleteBus);

export default router;
