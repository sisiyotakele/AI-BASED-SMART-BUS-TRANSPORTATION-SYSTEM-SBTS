import { z } from 'zod';

export const createNotificationSchema = z.object({
  notificationType: z.string().min(1).max(100),
  title: z.string().min(1).max(255),
  message: z.string().min(1),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  userIds: z.array(z.string().uuid()).min(1),
});

export const notificationIdParamSchema = z.object({ id: z.string().uuid() });
export const notificationQuerySchema = z.object({
  isRead: z.enum(['true', 'false']).optional(),
});
