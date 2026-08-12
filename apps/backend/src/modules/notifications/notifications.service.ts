import { NotFoundError } from '@/common/errors';
import { logger } from '@/common/logger';
import * as repository from './notifications.repository';

export async function createNotification(data: any, actorId?: string) {
  const notification = await repository.createNotification({
    notificationType: data.notificationType,
    title: data.title,
    message: data.message,
    priority: data.priority,
  });

  // Filter to only include users that exist in the database
  const existingUsers = await repository.findUsersByIds(data.userIds);
  const existingUserIds = existingUsers.map(u => u.id);

  if (existingUserIds.length > 0) {
    await repository.createManyNotificationUsers(
      existingUserIds.map((userId: string) => ({
        notificationId: notification.id,
        userId,
      }))
    );
  }

  logger.info('Notification created', { notificationId: notification.id, recipients: existingUserIds.length });
  return { ...notification, recipientCount: existingUserIds.length };
}

export async function listNotifications(userId: string, isRead?: boolean) {
  const where: any = { userId };
  if (isRead !== undefined) where.isRead = isRead;
  return repository.findNotificationUsers(where);
}

export async function markAsRead(notificationUserId: string, userId: string) {
  const nu = await repository.findNotificationUser(notificationUserId, userId);
  if (!nu) throw new NotFoundError('Notification not found', 'NOTIFICATION_NOT_FOUND');

  const updated = await repository.updateNotificationUser(notificationUserId, {
    isRead: true,
    readAt: new Date(),
  });
  logger.info('Notification marked as read', { notificationUserId });
  return updated;
}

// ============================================================
// DELIVERY TRACKING (NEW)
// ============================================================

export async function updateDeliveryStatus(
  notificationUserId: string,
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'bounced',
  failureReason?: string
) {
  const updateData: any = {
    deliveryStatus: status,
    lastAttemptAt: new Date(),
  };

  if (status === 'sent') {
    updateData.sentAt = new Date();
  } else if (status === 'delivered') {
    updateData.deliveredAt = new Date();
  } else if (status === 'failed' || status === 'bounced') {
    updateData.failedAt = new Date();
    if (failureReason) {
      updateData.failureReason = failureReason;
    }
  }

  const notificationUser = await repository.updateNotificationUser(notificationUserId, updateData);

  logger.info('Notification delivery status updated', {
    notificationUserId,
    status,
    failureReason,
  });

  return notificationUser;
}

export async function incrementDeliveryAttempts(notificationUserId: string) {
  const notificationUser = await repository.updateNotificationUser(notificationUserId, {
    deliveryAttempts: { increment: 1 },
    lastAttemptAt: new Date(),
  });

  logger.info('Notification delivery attempt incremented', {
    notificationUserId,
    attempts: notificationUser.deliveryAttempts,
  });

  return notificationUser;
}

export async function getFailedDeliveries(
  options: {
    maxAttempts?: number;
    olderThanMinutes?: number;
    limit?: number;
  } = {}
) {
  const { maxAttempts = 3, olderThanMinutes = 5, limit = 100 } = options;

  const retryThreshold = new Date();
  retryThreshold.setMinutes(retryThreshold.getMinutes() - olderThanMinutes);

  const failedDeliveries = await repository.findFailedNotifications(
    {
      deliveryStatus: 'failed',
      deliveryAttempts: { lt: maxAttempts },
      lastAttemptAt: { lt: retryThreshold },
    },
    {
      orderBy: { lastAttemptAt: 'asc' },
      take: limit,
    }
  );

  return failedDeliveries;
}

export async function getDeliveryStatistics(notificationId?: string) {
  const where: any = {};
  if (notificationId) {
    where.notificationId = notificationId;
  }

  const [
    totalRecipients,
    pending,
    sent,
    delivered,
    failed,
    bounced,
  ] = await Promise.all([
    repository.countNotificationUsers(where),
    repository.countNotificationUsers({ ...where, deliveryStatus: 'pending' }),
    repository.countNotificationUsers({ ...where, deliveryStatus: 'sent' }),
    repository.countNotificationUsers({ ...where, deliveryStatus: 'delivered' }),
    repository.countNotificationUsers({ ...where, deliveryStatus: 'failed' }),
    repository.countNotificationUsers({ ...where, deliveryStatus: 'bounced' }),
  ]);

  const deliveryRate = totalRecipients > 0
    ? ((delivered / totalRecipients) * 100).toFixed(2)
    : '0.00';

  return {
    totalRecipients,
    pending,
    sent,
    delivered,
    failed,
    bounced,
    deliveryRate: parseFloat(deliveryRate),
  };
}

export async function getUserDeliveryHistory(userId: string, limit = 50) {
  const deliveryHistory = await repository.findUserNotificationHistory(userId, limit);
  return deliveryHistory;
}

export async function retryFailedDelivery(notificationUserId: string) {
  const notificationUser = await repository.findNotificationUserById(notificationUserId);

  if (!notificationUser) {
    throw new NotFoundError('Notification not found', 'NOTIFICATION_NOT_FOUND');
  }

  if (notificationUser.deliveryStatus !== 'failed') {
    throw new Error('Can only retry failed deliveries');
  }

  // Reset to pending status for retry
  await repository.updateNotificationUser(notificationUserId, {
    deliveryStatus: 'pending',
    deliveryAttempts: { increment: 1 },
    lastAttemptAt: new Date(),
  });

  logger.info('Failed notification queued for retry', { notificationUserId });

  // Here you would trigger your actual notification delivery mechanism
  // (push notification service, email service, SMS service, etc.)

  return notificationUser;
}
