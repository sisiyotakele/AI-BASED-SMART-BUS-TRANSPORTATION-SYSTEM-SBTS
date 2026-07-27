import { prisma } from '@/prisma/client';

let db = prisma;

export function setPrismaClient(client: typeof prisma) {
    db = client;
}

// ============================================================
// SHIFT OVERLAP QUERIES
// ============================================================

export async function findOverlappingShift(
    driverId: string,
    shiftDate: Date,
    start: Date,
    end: Date
) {
    return db.shift.findFirst({
        where: {
            driverId,
            shiftDate,
            deletedAt: null,
            OR: [
                { shiftStart: { lte: end }, shiftEnd: { gte: start } },
            ],
        },
    });
}

// ============================================================
// SHIFT CRUD QUERIES
// ============================================================

export async function createShift(data: any) {
    return db.shift.create({ data });
}

export async function findShifts(where: any) {
    return db.shift.findMany({
        where,
        orderBy: { shiftDate: 'desc' },
        include: {
            driver: {
                select: { id: true, fullName: true }
            }
        }
    });
}

export async function findShiftById(id: string) {
    return db.shift.findFirst({
        where: { id, deletedAt: null },
        include: {
            driver: {
                select: { id: true, fullName: true }
            }
        }
    });
}

export async function updateShift(id: string, data: any) {
    return db.shift.update({
        where: { id },
        data
    });
}

export async function softDeleteShift(id: string) {
    return db.shift.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
}
