import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createShiftSchema, updateShiftSchema, shiftIdParamSchema, listShiftsQuerySchema } from './shifts.validation';
import { createShift, listShifts, getShift, updateShift, deleteShift } from './shifts.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/shifts:
 *   post:
 *     summary: Create a new shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - shiftName
 *               - startTime
 *               - endTime
 *             properties:
 *               shiftName:
 *                 type: string
 *               startTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *               endTime:
 *                 type: string
 *                 pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$'
 *     responses:
 *       201:
 *         description: Shift created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Shift name already exists
 *       500:
 *         description: Server error
 */
router.post('/', requirePermission('manage_shifts'), validateBody(createShiftSchema), createShift);

/**
 * @swagger
 * /api/v1/shifts:
 *   get:
 *     summary: List all shifts
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by shift name
 *     responses:
 *       200:
 *         description: List of shifts
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/', requirePermission('view_shifts'), validateQuery(listShiftsQuerySchema), listShifts);

/**
 * @swagger
 * /api/v1/shifts/{id}:
 *   get:
 *     summary: Get shift by ID
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Shift ID
 *     responses:
 *       200:
 *         description: Shift details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shift not found
 *       500:
 *         description: Server error
 */
router.get('/:id', requirePermission('view_shifts'), validateParams(shiftIdParamSchema), getShift);

/**
 * @swagger
 * /api/v1/shifts/{id}:
 *   patch:
 *     summary: Update shift
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Shift ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shiftName:
 *                 type: string
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *     responses:
 *       200:
 *         description: Shift updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shift not found
 *       500:
 *         description: Server error
 */
router.patch('/:id', requirePermission('manage_shifts'), validateParams(shiftIdParamSchema), validateBody(updateShiftSchema), updateShift);

/**
 * @swagger
 * /api/v1/shifts/{id}:
 *   delete:
 *     summary: Delete shift (soft delete)
 *     tags: [Shifts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Shift ID
 *     responses:
 *       200:
 *         description: Shift deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Shift not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', requirePermission('manage_shifts'), validateParams(shiftIdParamSchema), deleteShift);

export default router;
