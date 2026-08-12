import { prisma } from '@/prisma/client';

let db = prisma;

export function setPrismaClient(client: typeof prisma) {
    db = client;
}

// ============================================================
// SHIFT QUERIES
// ============================================================

export async function findShiftById(tx: any, shiftId: string) {
    return tx.shift.findFirst({
        where: { id: shiftId, deletedAt: null },
        include: { driver: true },
    });
}

// ============================================================
// BUS QUERIES
// ============================================================

export async function findBusById(tx: any, busId: string) {
    return tx.bus.findFirst({
        where: { id: busId, deletedAt: null }
    });
}

// ============================================================
// BUS-DRIVER ASSIGNMENT CONFLICT CHECKS
// ============================================================

export async function findBusAssignmentByDate(
    tx: any,
    busId: string,
    assignedDate: Date
) {
    return tx.busDriverAssignment.findFirst({
        where: {
            busId,
            assignedDate,
            deletedAt: null,
            status: 'active'
        },
    });
}

export async function findShiftAssignmentByDate(
    tx: any,
    shiftId: string,
    assignedDate: Date
) {
    return tx.busDriverAssignment.findFirst({
        where: {
            shiftId,
            assignedDate,
            deletedAt: null,
            status: 'active'
        },
    });
}

// ============================================================
// BUS-DRIVER ASSIGNMENT CRUD
// ============================================================

export async function createAssignment(tx: any, data: any) {
    return tx.busDriverAssignment.create({
        data,
        include: {
            bus: { select: { id: true, plateNumber: true } },
            shift: { include: { driver: { select: { id: true, fullName: true } } } },
        },
    });
}

export async function findAssignments(where: any) {
    return db.busDriverAssignment.findMany({
        where,
        include: {
            bus: { select: { id: true, plateNumber: true } },
            shift: { include: { driver: { select: { id: true, fullName: true } } } },
        },
        orderBy: { assignedDate: 'desc' },
    });
}

export async function findAssignmentById(id: string) {
    return db.busDriverAssignment.findFirst({
        where: { id, deletedAt: null },
        include: {
            bus: { select: { id: true, plateNumber: true } },
            shift: { include: { driver: { select: { id: true, fullName: true } } } },
        },
    });
}

export async function updateAssignment(id: string, data: any) {
    return db.busDriverAssignment.update({
        where: { id },
        data,
    });
}

export async function softDeleteAssignment(id: string) {
    return db.busDriverAssignment.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
}

// ============================================================
// TRANSACTION HELPER
// ============================================================

export async function executeTransaction(callback: (tx: any) => Promise<any>) {
    return db.$transaction(callback);
}
