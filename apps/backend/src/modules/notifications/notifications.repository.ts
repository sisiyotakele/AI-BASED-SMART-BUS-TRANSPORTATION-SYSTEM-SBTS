import { prisma } from '@/prisma/client';

// ============================================================
// NOTIFICATION QUERIES
// ============================================================

export async function createNotification(data: any) {
    return prisma.notification.create({ data });
}

// ============================================================
// USER QUERIES
// ============================================================

export async function findUsersByIds(userIds: string[]) {
    return prisma.user.findMany({
        where: { id: { in: userIds } },
        select: { id: true },
    });
}

// ============================================================
// NOTIFICATION-USER QUERIES
// ============================================================

export async function createManyNotificationUsers(data: any[]) {
    return prisma.notificationUser.createMany({
        data,
        skipDuplicates: true,
    });
}

export async function findNotificationUsers(where: any) {
    return prisma.notificationUser.findMany({
        where,
        include: {
            notification: {
                select: {
                    id: true,
                    notificationType: true,
                    title: true,
                    message: true,
                    priority: true,
                    createdAt: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function findNotificationUser(notificationUserId: string, userId: string) {
    return prisma.notificationUser.findFirst({
        where: { id: notificationUserId, userId },
    });
}

export async function findNotificationUserById(notificationUserId: string) {
    return prisma.notificationUser.findUnique({
        where: { id: notificationUserId },
        include: {
            notification: true,
            user: true,
        },
    });
}

export async function updateNotificationUser(notificationUserId: string, data: any) {
    return prisma.notificationUser.update({
        where: { id: notificationUserId },
        data,
    });
}

export async function findFailedNotifications(where: any, options: {
    orderBy?: any;
    take?: number;
}) {
    return prisma.notificationUser.findMany({
        where,
        include: {
            notification: {
                select: {
                    id: true,
                    notificationType: true,
                    title: true,
                    message: true,
                    priority: true,
                },
            },
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                },
            },
        },
        orderBy: options.orderBy,
        take: options.take,
    });
}

export async function findUserNotificationHistory(userId: string, limit: number) {
    return prisma.notificationUser.findMany({
        where: { userId },
        include: {
            notification: {
                select: {
                    id: true,
                    notificationType: true,
                    title: true,
                    message: true,
                    priority: true,
                    createdAt: true,
                },
            },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
}

// ============================================================
// STATISTICS QUERIES
// ============================================================

export async function countNotificationUsers(where: any) {
    return prisma.notificationUser.count({ where });
}
