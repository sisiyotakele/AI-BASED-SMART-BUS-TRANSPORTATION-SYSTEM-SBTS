import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createIncidentSchema, resolveIncidentSchema, incidentIdParamSchema, incidentQuerySchema } from './incidents.validation';
import { createIncident, listIncidents, getIncident, reviewIncident, resolveIncident, deleteIncident } from './incidents.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/incidents:
 *   post:
 *     summary: Report a new incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - severity
 *               - description
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [ACCIDENT, BREAKDOWN, DELAY, SAFETY, OTHER]
 *               severity:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *               description:
 *                 type: string
 *               tripId:
 *                 type: string
 *                 format: uuid
 *               busId:
 *                 type: string
 *                 format: uuid
 *               driverId:
 *                 type: string
 *                 format: uuid
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Incident reported successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       500:
 *         description: Internal server error
 */
router.post('/', requirePermission('report_incident'), validateBody(createIncidentSchema), createIncident);

/**
 * @swagger
 * /api/v1/incidents:
 *   get:
 *     summary: List all incidents
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, IN_REVIEW, RESOLVED, CLOSED]
 *         description: Filter by status
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [LOW, MEDIUM, HIGH, CRITICAL]
 *         description: Filter by severity
 *     responses:
 *       200:
 *         description: Incidents retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       500:
 *         description: Internal server error
 */
router.get('/', requirePermission('view_incidents'), validateQuery(incidentQuerySchema), listIncidents);

/**
 * @swagger
 * /api/v1/incidents/{id}:
 *   get:
 *     summary: Get incident details
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Incident ID
 *     responses:
 *       200:
 *         description: Incident retrieved successfully
 *       400:
 *         description: Invalid incident ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Incident not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', requirePermission('view_incidents'), validateParams(incidentIdParamSchema), getIncident);

/**
 * @swagger
 * /api/v1/incidents/{id}/review:
 *   patch:
 *     summary: Mark incident as under review
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Incident ID
 *     responses:
 *       200:
 *         description: Incident marked as under review
 *       400:
 *         description: Invalid incident ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Incident not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/review', requirePermission('review_incident'), validateParams(incidentIdParamSchema), reviewIncident);

/**
 * @swagger
 * /api/v1/incidents/{id}/resolve:
 *   patch:
 *     summary: Resolve an incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Incident ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resolution
 *             properties:
 *               resolution:
 *                 type: string
 *                 description: Description of how the incident was resolved
 *     responses:
 *       200:
 *         description: Incident resolved successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Incident not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/resolve', requirePermission('resolve_incident'), validateParams(incidentIdParamSchema), validateBody(resolveIncidentSchema), resolveIncident);

/**
 * @swagger
 * /api/v1/incidents/{id}:
 *   delete:
 *     summary: Delete an incident
 *     tags: [Incidents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Incident ID
 *     responses:
 *       200:
 *         description: Incident deleted successfully
 *       400:
 *         description: Invalid incident ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Incident not found
 *       500:
 *         description: Internal server error
 */
router.delete('/:id', requirePermission('delete_incident'), validateParams(incidentIdParamSchema), deleteIncident);

export default router;
