import { prisma } from '@/prisma/client';

let db = prisma;

export function setPrismaClient(client: typeof prisma) {
    db = client;
}

// ============================================================
// BUS-ROUTE ASSIGNMENT QUERIES
// ============================================================

export async function createAssignment(data: any) {
    return db.busRouteAssignment.create({
        data,
        include: {
            bus: { select: { id: true, plateNumber: true } },
            route: { select: { id: true, routeName: true } },
        },
    });
}

export async function findAssignments(where: any) {
    return db.busRouteAssignment.findMany({
        where,
        include: {
            bus: { select: { id: true, plateNumber: true } },
            route: { select: { id: true, routeName: true } },
        },
        orderBy: { assignedDate: 'desc' },
    });
}

export async function findAssignmentById(id: string) {
    return db.busRouteAssignment.findFirst({
        where: { id, deletedAt: null },
        include: {
            bus: { select: { id: true, plateNumber: true } },
            route: { select: { id: true, routeName: true } },
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
