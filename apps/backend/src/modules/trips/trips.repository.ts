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
            shiftId: data.shiftId,
            tripDate: data.tripDate,
            keyHandoverId: data.keyHandoverId,
            scheduledStart: data.scheduledStart,
            scheduledEnd: data.scheduledEnd,
            status: 'scheduled',
        },
        include: {
            bus: { select: { id: true, plateNumber: true, model: true } },
            driver: { select: { id: true, fullName: true } },
            version: { 
                include: { 
                    route: { select: { routeName: true, id: true, description: true } } 
                } 
            },
            schedule: { select: { id: true, scheduleName: true, departureTime: true } },
            shift: { select: { id: true, shiftStart: true, shiftEnd: true } },
        },
    });
}

export async function findScheduleWithVersionAndStops(scheduleId: string) {
    return db.schedule.findFirst({
        where: { id: scheduleId, deletedAt: null },
        include: {
            route: {
                include: {
                    startTerminal: true,
                    endTerminal: true,
                }
            },
            version: {
                include: {
                    routeStops: {
                        include: { stop: true },
                        orderBy: { sequenceNumber: 'asc' },
                    }
                }
            }
        }
    });
}

export async function findBusRouteAssignmentForSchedule(scheduleId: string, routeId: string) {
    return db.busRouteAssignment.findFirst({
        where: {
            OR: [
                { scheduleId },
                { routeId }
            ],
            isActive: true,
            deletedAt: null
        },
        include: {
            bus: true
        },
        orderBy: { createdAt: 'desc' }
    });
}

export async function findBusDriverAssignmentForBusAndDate(busId: string, date: Date) {
    // Format start/end of day for comparison
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return db.busDriverAssignment.findFirst({
        where: {
            busId,
            assignedDate: {
                gte: startOfDay,
                lte: endOfDay
            },
            status: 'active',
            deletedAt: null
        },
        include: {
            shift: {
                include: {
                    driver: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

export async function findTripByScheduleAndDate(scheduleId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return db.trip.findFirst({
        where: {
            scheduleId,
            deletedAt: null,
            OR: [
                { tripDate: { gte: startOfDay, lte: endOfDay } },
                { scheduledStart: { gte: startOfDay, lte: endOfDay } }
            ]
        }
    });
}

export async function findTrips(where: any) {
    return db.trip.findMany({
        where,
        include: {
            bus: { select: { id: true, plateNumber: true, model: true } },
            driver: { select: { id: true, fullName: true, email: true } },
            version: { 
                include: { 
                    route: { 
                        include: {
                            startTerminal: true,
                            endTerminal: true
                        }
                    },
                    routeStops: {
                        include: { stop: true },
                        orderBy: { sequenceNumber: 'asc' }
                    }
                } 
            },
            schedule: { include: { route: true, version: true } },
            shift: { select: { id: true, shiftStart: true, shiftEnd: true, shiftDate: true } },
        },
        orderBy: { scheduledStart: 'desc' },
    });
}

export async function findTripById(id: string) {
    return db.trip.findFirst({
        where: { id, deletedAt: null },
        include: {
            bus: { select: { id: true, plateNumber: true, model: true, capacity: true } },
            driver: { select: { id: true, fullName: true, phone: true } },
            version: { 
                include: { 
                    route: {
                        include: {
                            startTerminal: true,
                            endTerminal: true
                        }
                    },
                    routeStops: {
                        include: { stop: true },
                        orderBy: { sequenceNumber: 'asc' }
                    }
                } 
            },
            schedule: { include: { route: true } },
            shift: { select: { id: true, shiftStart: true, shiftEnd: true, shiftDate: true } },
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

