import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createNotificationSchema, notificationIdParamSchema, notificationQuerySchema } from './notifications.validation';
import { createNotification, listNotifications, markAsRead } from './notifications.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

router.post('/', requirePermission('manage_notifications'), validateBody(createNotificationSchema), createNotification);
router.get('/', validateQuery(notificationQuerySchema), listNotifications); // User can view their own notifications
router.patch('/:id/read', validateParams(notificationIdParamSchema), markAsRead); // User can mark their own as read

export default router;
