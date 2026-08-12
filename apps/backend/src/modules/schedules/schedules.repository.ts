import { prisma as defaultPrisma } from '@/prisma/client';

let prisma = defaultPrisma;

export function setPrismaClient(client: typeof defaultPrisma) {
    prisma = client;
}

// ============================================================
// SCHEDULE QUERIES
// ============================================================

export async function createSchedule(data: any) {
    return prisma.schedule.create({ data });
}

export async function findSchedules(where: any) {
    return prisma.schedule.findMany({
        where,
        include: {
            route: { select: { id: true, routeName: true } },
            version: { select: { id: true, versionNumber: true } },
        },
        orderBy: { departureTime: 'asc' },
    });
}

export async function findScheduleById(id: string) {
    return prisma.schedule.findFirst({
        where: { id, deletedAt: null },
        include: {
            route: { select: { id: true, routeName: true } },
            version: { select: { id: true, versionNumber: true } },
        },
    });
}

export async function updateSchedule(id: string, data: any) {
    return prisma.schedule.update({
        where: { id },
        data
    });
}

export async function softDeleteSchedule(id: string) {
    return prisma.schedule.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
}
