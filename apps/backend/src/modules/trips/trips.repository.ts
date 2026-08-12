import { prisma } from '@/prisma/client';

// Allow test injection
let db = prisma;

export function setPrismaClient(client: typeof prisma) {
    db = client;
}

// ============================================================
// TRIP OVERLAP QUERIES
// ============================================================

export async function findBusOverlappingTrip(
    tx: any,
    busId: string,
    scheduledStart: Date,
    scheduledEnd: Date
) {
    return tx.trip.findFirst({
        where: {
            busId,
            status: { in: ['scheduled', 'in_progress'] },
            deletedAt: null,
            OR: [
                {
                    scheduledStart: { lte: scheduledEnd },
                    scheduledEnd: { gte: scheduledStart }
                },
            ],
        },
    });
}

export async function findDriverOverlappingTrip(
    tx: any,
    driverId: string,
    scheduledStart: Date,
    scheduledEnd: Date
) {
    return tx.trip.findFirst({
        where: {
            driverId,
            status: { in: ['scheduled', 'in_progress'] },
            deletedAt: null,
            OR: [
                {
                    scheduledStart: { lte: scheduledEnd },
                    scheduledEnd: { gte: scheduledStart }
                },
            ],
        },
    });
}

// ============================================================
// TRIP CRUD QUERIES
// ============================================================

export async function createTrip(tx: any, data: any) {
    return tx.trip.create({
        data: {
            busId: data.busId,
            driverId: data.driverId,
            versionId: data.versionId,
            scheduleId: data.scheduleId,
            keyHandoverId: data.keyHandoverId,
            scheduledStart: data.scheduledStart,
            scheduledEnd: data.scheduledEnd,
            status: 'scheduled',
        },
        include: {
            bus: { select: { id: true, plateNumber: true } },
            driver: { select: { id: true, fullName: true } },
            version: { select: { id: true, versionNumber: true } },
            schedule: { select: { id: true, scheduleName: true } },
        },
    });
}

export async function findTrips(where: any) {
    return db.trip.findMany({
        where,
        include: {
            bus: { select: { id: true, plateNumber: true } },
            driver: { select: { id: true, fullName: true } },
            version: { select: { id: true, versionNumber: true } },
            schedule: { select: { id: true, scheduleName: true } },
        },
        orderBy: { scheduledStart: 'desc' },
    });
}

export async function findTripById(id: string) {
    return db.trip.findFirst({
        where: { id, deletedAt: null },
        include: {
            bus: { select: { id: true, plateNumber: true } },
            driver: { select: { id: true, fullName: true } },
            version: { select: { id: true, versionNumber: true } },
            schedule: { select: { id: true, scheduleName: true } },
        },
    });
}

export async function updateTrip(id: string, data: any) {
    return db.trip.update({
        where: { id },
        data
    });
}

export async function softDeleteTrip(id: string) {
    return db.trip.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
}

// ============================================================
// TRANSACTION HELPER
// ============================================================

export async function executeTransaction(
    callback: (tx: any) => Promise<any>,
    options?: any
) {
    return db.$transaction(callback, options);
}
