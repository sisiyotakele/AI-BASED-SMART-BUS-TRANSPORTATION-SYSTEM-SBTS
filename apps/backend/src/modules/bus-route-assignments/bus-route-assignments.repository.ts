import { prisma } from '@/prisma/client';

let db = prisma;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dbAny: any = db;

export function setPrismaClient(client: typeof prisma) {
    db = client;
    dbAny = client;
}

const ASSIGNMENT_INCLUDE = {
    bus: { select: { id: true, plateNumber: true } },
    route: { select: { id: true, routeName: true } },
};

// ============================================================
// BUS-ROUTE ASSIGNMENT QUERIES
// ============================================================

export async function createAssignment(data: any) {
    return dbAny.busRouteAssignment.create({
        data,
        include: {
            ...ASSIGNMENT_INCLUDE,
            schedule: { select: { id: true, scheduleName: true, departureTime: true, dayOfWeek: true } },
        },
    });
}

export async function findAssignments(where: any) {
    return dbAny.busRouteAssignment.findMany({
        where,
        include: {
            ...ASSIGNMENT_INCLUDE,
            schedule: { select: { id: true, scheduleName: true, departureTime: true, dayOfWeek: true } },
        },
        orderBy: { assignedDate: 'desc' },
    });
}

export async function findAssignmentById(id: string) {
    return dbAny.busRouteAssignment.findFirst({
        where: { id, deletedAt: null },
        include: {
            ...ASSIGNMENT_INCLUDE,
            schedule: { select: { id: true, scheduleName: true, departureTime: true, dayOfWeek: true } },
        },
    });
}

export async function updateAssignment(id: string, data: any) {
    return db.busRouteAssignment.update({
        where: { id },
        data,
    });
}

export async function softDeleteAssignment(id: string) {
    return db.busRouteAssignment.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
}

/**
 * Checks if a schedule already has a bus assigned,
 * and returns the list of available (operational) buses for it.
 */
export async function checkScheduleAvailability(scheduleId: string) {
    // Find the active assignment for this specific schedule (if any)
    const existing = await dbAny.busRouteAssignment.findFirst({
        where: { scheduleId, isActive: true, deletedAt: null },
        include: {
            bus: { select: { id: true, plateNumber: true, model: true, capacity: true, maintenanceStatus: true } },
        },
    });

    const assignedBusIds: string[] = existing ? [existing.busId] : [];

    // Return all operational buses that are NOT currently assigned to ANY active schedule
    const availableBuses = await db.bus.findMany({
        where: {
            deletedAt: null,
            maintenanceStatus: 'operational',
            ...(assignedBusIds.length > 0 ? { id: { notIn: assignedBusIds } } : {}),
        },
        orderBy: { plateNumber: 'asc' },
        include: { terminal: { select: { terminalName: true } } },
    });

    return {
        scheduleId,
        isAssigned: !!existing,
        assignedBus: (existing as any)?.bus || null,
        availableBuses,
    };
}
