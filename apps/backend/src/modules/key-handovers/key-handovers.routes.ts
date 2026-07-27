import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createHandoverSchema, handoverIdParamSchema, handoverQuerySchema } from './key-handovers.validation';
import { createHandover, listHandovers, getHandover, confirmFrom, confirmTo } from './key-handovers.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/key-handovers:
 *   post:
 *     summary: Create a new key handover
 *     tags: [Key Handovers]
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
 *               - terminalId
 *               - toShiftId
 *               - handoverTime
 *             properties:
 *               busId:
 *                 type: string
 *                 format: uuid
 *               terminalId:
 *                 type: string
 *                 format: uuid
 *               fromShiftId:
 *                 type: string
 *                 format: uuid
 *               toShiftId:
 *                 type: string
 *                 format: uuid
 *               handoverTime:
 *                 type: string
 *                 format: date-time
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Handover created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Foreign key constraint error
 *       500:
 *         description: Server error
 */
router.post('/', requirePermission('manage_key_handovers'), validateBody(createHandoverSchema), createHandover);

/**
 * @swagger
 * /api/v1/key-handovers:
 *   get:
 *     summary: List all key handovers
 *     tags: [Key Handovers]
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
 *         name: terminalId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by terminal
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed_from, confirmed_to, cancelled]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: List of handovers
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/', requirePermission('view_key_handovers'), validateQuery(handoverQuerySchema), listHandovers);

/**
 * @swagger
 * /api/v1/key-handovers/{id}:
 *   get:
 *     summary: Get handover by ID
 *     tags: [Key Handovers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Handover ID
 *     responses:
 *       200:
 *         description: Handover details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Handover not found
 *       500:
 *         description: Server error
 */
router.get('/:id', requirePermission('view_key_handovers'), validateParams(handoverIdParamSchema), getHandover);

/**
 * @swagger
 * /api/v1/key-handovers/{id}/confirm-from:
 *   patch:
 *     summary: Confirm handover from outgoing driver
 *     tags: [Key Handovers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Handover ID
 *     responses:
 *       200:
 *         description: Handover confirmed from outgoing driver
 *       400:
 *         description: Invalid state transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Handover not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/confirm-from', requirePermission('manage_key_handovers'), validateParams(handoverIdParamSchema), confirmFrom);

/**
 * @swagger
 * /api/v1/key-handovers/{id}/confirm-to:
 *   patch:
 *     summary: Confirm handover to incoming driver
 *     tags: [Key Handovers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Handover ID
 *     responses:
 *       200:
 *         description: Handover confirmed to incoming driver
 *       400:
 *         description: Invalid state transition
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Handover not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/confirm-to', requirePermission('manage_key_handovers'), validateParams(handoverIdParamSchema), confirmTo);

export default router;
