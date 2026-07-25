import { prisma } from '@/prisma/client';
import * as notificationService from '../notifications.service';
import { NotFoundError } from '@/common/errors';
import { createTestUser } from '@/common/test-utils/factories';

describe('Notifications Service', () => {
    let user1: any;
    let user2: any;
    let user3: any;

    beforeAll(async () => {
        user1 = await createTestUser({ email: 'user1@test.com' });
        user2 = await createTestUser({ email: 'user2@test.com' });
        user3 = await createTestUser({ email: 'user3@test.com' });
    });

    afterEach(async () => {
        await prisma.notificationUser.deleteMany({});
        await prisma.notification.deleteMany({});
    });

    describe('createNotification', () => {
        it('should create a notification with recipients', async () => {
            const notificationData = {
                notificationType: 'trip_update',
                title: 'Trip Delayed',
                message: 'Your trip has been delayed by 15 minutes',
                priority: 'high',
                userIds: [user1.id, user2.id],
            };

            const notification = await notificationService.createNotification(notificationData, user3.id);

            expect(notification).toBeDefined();
            expect(notification.title).toBe('Trip Delayed');
            expect(notification.priority).toBe('high');
            expect(notification.recipientCount).toBe(2);

            const recipients = await prisma.notificationUser.findMany({
                where: { notificationId: notification.id },
            });
            expect(recipients).toHaveLength(2);
        });

        it('should create notification with default priority', async () => {
            const notificationData = {
                notificationType: 'info',
                title: 'Info Message',
                message: 'General information',
                userIds: [user1.id],
            };

            const notification = await notificationService.createNotification(notificationData);

            expect(notification.priority).toBeDefined();
        });
    });

    describe('listNotifications', () => {
        let notification1: any;
        let notification2: any;

        beforeEach(async () => {
            notification1 = await notificationService.createNotification({
                notificationType: 'info',
                title: 'Notification 1',
                message: 'Message 1',
                priority: 'normal',
                userIds: [user1.id, user2.id],
            });

            notification2 = await notificationService.createNotification({
                notificationType: 'alert',
                title: 'Notification 2',
                message: 'Message 2',
                priority: 'urgent',
                userIds: [user1.id],
            });

            // Mark one as read
            const user1Notif1 = await prisma.notificationUser.findFirst({
                where: { notificationId: notification1.id, userId: user1.id },
            });
            if (user1Notif1) {
                await prisma.notificationUser.update({
                    where: { id: user1Notif1.id },
                    data: { isRead: true, readAt: new Date() },
                });
            }
        });

        it('should list all notifications for a user', async () => {
            const notifications = await notificationService.listNotifications(user1.id);

            expect(notifications).toHaveLength(2);
            expect(notifications[0].notification).toBeDefined();
        });

        it('should filter by read status (unread only)', async () => {
            const notifications = await notificationService.listNotifications(user1.id, false);

            expect(notifications.length).toBeGreaterThanOrEqual(1);
            expect(notifications.every(n => !n.isRead)).toBe(true);
        });

        it('should filter by read status (read only)', async () => {
            const notifications = await notificationService.listNotifications(user1.id, true);

            expect(notifications.length).toBeGreaterThanOrEqual(1);
            expect(notifications.every(n => n.isRead)).toBe(true);
        });

        it('should return empty array for user with no notifications', async () => {
            const notifications = await notificationService.listNotifications(user3.id);

            expect(notifications).toHaveLength(0);
        });
    });

    describe('markAsRead', () => {
        it('should mark notification as read', async () => {
            const notification = await notificationService.createNotification({
                notificationType: 'info',
                title: 'Test',
                message: 'Test message',
                userIds: [user1.id],
            });

            const notificationUser = await prisma.notificationUser.findFirst({
                where: { notificationId: notification.id, userId: user1.id },
            });

            const marked = await notificationService.markAsRead(notificationUser!.id, user1.id);

            expect(marked.isRead).toBe(true);
            expect(marked.readAt).toBeInstanceOf(Date);
        });

        it('should throw NotFoundError for non-existent notification', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                notificationService.markAsRead(fakeId, user1.id)
            ).rejects.toThrow(NotFoundError);
        });

        it('should throw NotFoundError when user does not own notification', async () => {
            const notification = await notificationService.createNotification({
                notificationType: 'info',
                title: 'Test',
                message: 'Test',
                userIds: [user1.id],
            });

            const notificationUser = await prisma.notificationUser.findFirst({
                where: { notificationId: notification.id, userId: user1.id },
            });

            await expect(
                notificationService.markAsRead(notificationUser!.id, user2.id) // Wrong user
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('updateDeliveryStatus', () => {
        let notificationUser: any;

        beforeEach(async () => {
            const notification = await notificationService.createNotification({
                notificationType: 'info',
                title: 'Test',
                message: 'Test',
                userIds: [user1.id],
            });

            notificationUser = await prisma.notificationUser.findFirst({
                where: { notificationId: notification.id, userId: user1.id },
            });
        });

        it('should update delivery status to sent', async () => {
            const updated = await notificationService.updateDeliveryStatus(
                notificationUser.id,
                'sent'
            );

            expect(updated.deliveryStatus).toBe('sent');
            expect(updated.sentAt).toBeInstanceOf(Date);
            expect(updated.lastAttemptAt).toBeInstanceOf(Date);
        });

        it('should update delivery status to delivered', async () => {
            const updated = await notificationService.updateDeliveryStatus(
                notificationUser.id,
                'delivered'
            );

            expect(updated.deliveryStatus).toBe('delivered');
            expect(updated.deliveredAt).toBeInstanceOf(Date);
        });

        it('should update delivery status to failed with reason', async () => {
            const updated = await notificationService.updateDeliveryStatus(
                notificationUser.id,
                'failed',
                'Invalid FCM token'
            );

            expect(updated.deliveryStatus).toBe('failed');
            expect(updated.failedAt).toBeInstanceOf(Date);
            expect(updated.failureReason).toBe('Invalid FCM token');
        });
    });

    describe('incrementDeliveryAttempts', () => {
        it('should increment delivery attempts', async () => {
            const notification = await notificationService.createNotification({
                notificationType: 'info',
                title: 'Test',
                message: 'Test',
                userIds: [user1.id],
            });

            const notificationUser = await prisma.notificationUser.findFirst({
                where: { notificationId: notification.id, userId: user1.id },
            });

            const updated1 = await notificationService.incrementDeliveryAttempts(notificationUser!.id);
            expect(updated1.deliveryAttempts).toBe(1);

            const updated2 = await notificationService.incrementDeliveryAttempts(notificationUser!.id);
            expect(updated2.deliveryAttempts).toBe(2);

            const updated3 = await notificationService.incrementDeliveryAttempts(notificationUser!.id);
            expect(updated3.deliveryAttempts).toBe(3);
        });
    });

    describe('getFailedDeliveries', () => {
        it('should get failed deliveries ready for retry', async () => {
            const notification = await notificationService.createNotification({
                notificationType: 'info',
                title: 'Test',
                message: 'Test',
                userIds: [user1.id, user2.id],
            });

            const notificationUsers = await prisma.notificationUser.findMany({
                where: { notificationId: notification.id },
            });

            // Mark both as failed with different attempt counts
            await notificationService.updateDeliveryStatus(notificationUsers[0].id, 'failed');
            await notificationService.incrementDeliveryAttempts(notificationUsers[0].id);

            await notificationService.updateDeliveryStatus(notificationUsers[1].id, 'failed');
            await notificationService.incrementDeliveryAttempts(notificationUsers[1].id);
            await notificationService.incrementDeliveryAttempts(notificationUsers[1].id);

            // Set lastAttemptAt to past (to pass retry threshold)
            const pastTime = new Date();
            pastTime.setMinutes(pastTime.getMinutes() - 10);
            await prisma.notificationUser.updateMany({
                where: { id: { in: notificationUsers.map(nu => nu.id) } },
                data: { lastAttemptAt: pastTime },
            });

            const failedDeliveries = await notificationService.getFailedDeliveries({
                maxAttempts: 3,
                olderThanMinutes: 5,
                limit: 100,
            });

            expect(failedDeliveries.length).toBeGreaterThanOrEqual(2);
            expect(failedDeliveries.every(fd => fd.deliveryStatus === 'failed')).toBe(true);
            expect(failedDeliveries.every(fd => fd.deliveryAttempts < 3)).toBe(true);
        });
    });

    describe('getDeliveryStatistics', () => {
        it('should get delivery statistics for all notifications', async () => {
            const notification = await notificationService.createNotification({
                notificationType: 'info',
                title: 'Test',
                message: 'Test',
                userIds: [user1.id, user2.id, user3.id],
            });

            const notificationUsers = await prisma.notificationUser.findMany({
                where: { notificationId: notification.id },
            });

            await notificationService.updateDeliveryStatus(notificationUsers[0].id, 'delivered');
            await notificationService.updateDeliveryStatus(notificationUsers[1].id, 'sent');
            await notificationService.updateDeliveryStatus(notificationUsers[2].id, 'failed');

            const stats = await notificationService.getDeliveryStatistics();

            expect(stats.totalRecipients).toBeGreaterThanOrEqual(3);
            expect(stats.delivered).toBeGreaterThanOrEqual(1);
            expect(stats.sent).toBeGreaterThanOrEqual(1);
            expect(stats.failed).toBeGreaterThanOrEqual(1);
            expect(stats.deliveryRate).toBeDefined();
            expect(typeof stats.deliveryRate).toBe('number');
        });

        it('should get delivery statistics for specific notification', async () => {
            const notification = await notificationService.createNotification({
                notificationType: 'info',
                title: 'Test',
                message: 'Test',
                userIds: [user1.id, user2.id],
            });

            const notificationUsers = await prisma.notificationUser.findMany({
                where: { notificationId: notification.id },
            });

            await notificationService.updateDeliveryStatus(notificationUsers[0].id, 'delivered');
            await notificationService.updateDeliveryStatus(notificationUsers[1].id, 'delivered');

            const stats = await notificationService.getDeliveryStatistics(notification.id);

            expect(stats.totalRecipients).toBe(2);
            expect(stats.delivered).toBe(2);
            expect(stats.deliveryRate).toBe(100);
        });
    });

    describe('getUserDeliveryHistory', () => {
        it('should get user delivery history', async () => {
            await notificationService.createNotification({
                notificationType: 'info',
                title: 'Notification 1',
                message: 'Message 1',
                userIds: [user1.id],
            });

            await notificationService.createNotification({
                notificationType: 'alert',
                title: 'Notification 2',
                message: 'Message 2',
                userIds: [user1.id],
            });

            const history = await notificationService.getUserDeliveryHistory(user1.id, 10);

            expect(history).toHaveLength(2);
            expect(history[0].notification).toBeDefined();
            expect(history[0].deliveryStatus).toBe('pending'); // Default status
        });
    });

    describe('retryFailedDelivery', () => {
        it('should retry a failed delivery', async () => {
            const notification = await notificationService.createNotification({
                notificationType: 'info',
                title: 'Test',
                message: 'Test',
                userIds: [user1.id],
            });

            const notificationUser = await prisma.notificationUser.findFirst({
                where: { notificationId: notification.id, userId: user1.id },
            });

            // Mark as failed
            await notificationService.updateDeliveryStatus(notificationUser!.id, 'failed');
            await notificationService.incrementDeliveryAttempts(notificationUser!.id);

            const before = await prisma.notificationUser.findUnique({
                where: { id: notificationUser!.id },
            });
            expect(before!.deliveryStatus).toBe('failed');
            expect(before!.deliveryAttempts).toBe(1);

            // Retry
            await notificationService.retryFailedDelivery(notificationUser!.id);

            const after = await prisma.notificationUser.findUnique({
                where: { id: notificationUser!.id },
            });
            expect(after!.deliveryStatus).toBe('pending'); // Reset to pending
            expect(after!.deliveryAttempts).toBe(2); // Incremented
        });

        it('should throw error when retrying non-failed delivery', async () => {
            const notification = await notificationService.createNotification({
                notificationType: 'info',
                title: 'Test',
                message: 'Test',
                userIds: [user1.id],
            });

            const notificationUser = await prisma.notificationUser.findFirst({
                where: { notificationId: notification.id, userId: user1.id },
            });

            // Status is 'pending', not 'failed'
            await expect(
                notificationService.retryFailedDelivery(notificationUser!.id)
            ).rejects.toThrow('Can only retry failed deliveries');
        });
    });
});
