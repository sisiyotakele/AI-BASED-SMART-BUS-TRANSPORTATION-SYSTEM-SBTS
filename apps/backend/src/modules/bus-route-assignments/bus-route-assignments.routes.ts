import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createAssignmentSchema, deactivateSchema, assignmentIdParamSchema, assignmentQuerySchema } from './bus-route-assignments.validation';
import { createAssignment, listAssignments, getAssignment, deactivateAssignment, deleteAssignment } from './bus-route-assignments.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/bus-route-assignments:
 *   post:
 *     summary: Create a new bus-route assignment
 *     tags: [Bus Route Assignments]
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
 *               - routeId
 *               - versionId
 *               - assignedDate
 *             properties:
 *               busId:
 *                 type: string
 *                 format: uuid
 *               routeId:
 *                 type: string
 *                 format: uuid
 *               versionId:
 *                 type: string
 *                 format: uuid
 *               assignedDate:
 *                 type: string
 *                 format: date-time
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Assignment created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post('/', requirePermission('manage_assignments'), validateBody(createAssignmentSchema), createAssignment);

/**
 * @swagger
 * /api/v1/bus-route-assignments:
 *   get:
 *     summary: List all bus-route assignments
 *     tags: [Bus Route Assignments]
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
 *         name: routeId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by route
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filter by active status
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
 * /api/v1/bus-route-assignments/{id}:
 *   get:
 *     summary: Get assignment by ID
 *     tags: [Bus Route Assignments]
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
 * /api/v1/bus-route-assignments/{id}/deactivate:
 *   patch:
 *     summary: Deactivate assignment
 *     tags: [Bus Route Assignments]
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
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endDate:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Assignment deactivated successfully
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
router.patch('/:id/deactivate', requirePermission('manage_assignments'), validateParams(assignmentIdParamSchema), validateBody(deactivateSchema), deactivateAssignment);

/**
 * @swagger
 * /api/v1/bus-route-assignments/{id}:
 *   delete:
 *     summary: Delete assignment (soft delete)
 *     tags: [Bus Route Assignments]
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
