import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createAssignmentSchema, updateAssignmentSchema, assignmentIdParamSchema, assignmentQuerySchema } from './bus-driver-assignments.validation';
import { createAssignment, listAssignments, getAssignment, updateAssignment, deleteAssignment } from './bus-driver-assignments.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/bus-driver-assignments:
 *   post:
 *     summary: Create a new bus-driver assignment
 *     tags: [Bus Driver Assignments]
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
 *               - shiftId
 *               - assignedDate
 *             properties:
 *               busId:
 *                 type: string
 *                 format: uuid
 *               driverId:
 *                 type: string
 *                 format: uuid
 *               shiftId:
 *                 type: string
 *                 format: uuid
 *               assignedDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Assignment created successfully
 *       400:
 *         description: Validation error or bus/driver already assigned
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: Conflict - bus in maintenance or driver license expired
 *       500:
 *         description: Server error
 */
router.post('/', requirePermission('manage_assignments'), validateBody(createAssignmentSchema), createAssignment);

/**
 * @swagger
 * /api/v1/bus-driver-assignments:
 *   get:
 *     summary: List all bus-driver assignments
 *     tags: [Bus Driver Assignments]
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
 *         name: shiftId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by shift
 *       - in: query
 *         name: assignedDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by date
 *     responses:
 *       200:
 *         description: List of assignments
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get('/', requirePermission('view_assignments'), validateQuery(assignmentQuerySchema), listAssignments);

/**
 * @swagger
 * /api/v1/bus-driver-assignments/{id}:
 *   get:
 *     summary: Get assignment by ID
 *     tags: [Bus Driver Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: Assignment details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Assignment not found
 *       500:
 *         description: Server error
 */
router.get('/:id', requirePermission('view_assignments'), validateParams(assignmentIdParamSchema), getAssignment);

/**
 * @swagger
 * /api/v1/bus-driver-assignments/{id}:
 *   patch:
 *     summary: Update assignment
 *     tags: [Bus Driver Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Assignment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shiftId:
 *                 type: string
 *                 format: uuid
 *               assignedDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Assignment updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Assignment not found
 *       500:
 *         description: Server error
 */
router.patch('/:id', requirePermission('manage_assignments'), validateParams(assignmentIdParamSchema), validateBody(updateAssignmentSchema), updateAssignment);

/**
 * @swagger
 * /api/v1/bus-driver-assignments/{id}:
 *   delete:
 *     summary: Delete assignment (soft delete)
 *     tags: [Bus Driver Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Assignment ID
 *     responses:
 *       200:
 *         description: Assignment deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Assignment not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', requirePermission('manage_assignments'), validateParams(assignmentIdParamSchema), deleteAssignment);

export default router;
