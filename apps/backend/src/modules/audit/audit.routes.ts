import { Router } from 'express';
import * as auditController from './audit.controller';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac/rbac.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/audit:
 *   get:
 *     summary: Get all audit logs
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    '/',
    authenticate,
    requirePermission('audit_logs:read'),
    auditController.getAllAuditLogs
);

/**
 * @swagger
 * /api/v1/audit/search:
 *   get:
 *     summary: Search audit logs
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action
 *       - in: query
 *         name: entityName
 *         schema:
 *           type: string
 *         description: Filter by entity name
 *     responses:
 *       200:
 *         description: Search completed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    '/search',
    authenticate,
    requirePermission('audit_logs:read'),
    auditController.searchAuditLogs
);

/**
 * @swagger
 * /api/v1/audit/user/{userId}:
 *   get:
 *     summary: Get audit logs by user
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User audit logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    '/user/:userId',
    authenticate,
    requirePermission('audit_logs:read'),
    auditController.getAuditLogsByUser
);

/**
 * @swagger
 * /api/v1/audit/entity/{entityName}:
 *   get:
 *     summary: Get audit logs by entity
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entityName
 *         required: true
 *         schema:
 *           type: string
 *         description: Entity name
 *       - in: query
 *         name: entityId
 *         schema:
 *           type: string
 *         description: Optional entity ID
 *     responses:
 *       200:
 *         description: Entity audit logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    '/entity/:entityName',
    authenticate,
    requirePermission('audit_logs:read'),
    auditController.getAuditLogsByEntity
);

/**
 * @swagger
 * /api/v1/audit/{id}:
 *   get:
 *     summary: Get audit log by ID
 *     tags: [Audit]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Audit log ID
 *     responses:
 *       200:
 *         description: Audit log retrieved successfully
 *       404:
 *         description: Audit log not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    '/:id',
    authenticate,
    requirePermission('audit_logs:read'),
    auditController.getAuditLogById
);

export default router;
