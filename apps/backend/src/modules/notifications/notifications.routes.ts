import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createNotificationSchema, notificationIdParamSchema, notificationQuerySchema } from './notifications.validation';
import { createNotification, listNotifications, markAsRead } from './notifications.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/notifications:
 *   post:
 *     summary: Create a new notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notificationType
 *               - title
 *               - message
 *               - priority
 *               - userIds
 *             properties:
 *               notificationType:
 *                 type: string
 *                 enum: [TRIP_UPDATE, ROUTE_CHANGE, MAINTENANCE, SYSTEM, EMERGENCY]
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *               userIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       500:
 *         description: Internal server error
 */
router.post('/', requirePermission('manage_notifications'), validateBody(createNotificationSchema), createNotification);

/**
 * @swagger
 * /api/v1/notifications:
 *   get:
 *     summary: List user notifications
 *     tags: [Notifications]
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
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/', validateQuery(notificationQuerySchema), listNotifications);

/**
 * @swagger
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       400:
 *         description: Invalid notification ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: Notification not found
 *       500:
 *         description: Internal server error
 */
router.patch('/:id/read', validateParams(notificationIdParamSchema), markAsRead);

export default router;
