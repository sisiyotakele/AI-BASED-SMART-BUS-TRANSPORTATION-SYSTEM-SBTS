import { prisma } from '@/prisma/client';

// Allow test injection
let db = prisma;

export function setPrismaClient(client: typeof prisma) {
    db = client;
}

// ============================================================
// TRIP QUERIES
// ============================================================

export async function findTripById(tripId: string) {
    return db.trip.findFirst({
        where: { id: tripId, deletedAt: null },
        include: { bus: true, driver: true },
    });
}

// ============================================================
// USER QUERIES
// ============================================================

export async function findUserById(userId: string) {
    return db.user.findUnique({
        where: { id: userId }
    });
}

// ============================================================
// INCIDENT QUERIES
// ============================================================

export async function createIncident(data: any) {
    return db.incident.create({ data });
}

export async function findIncidents(where: any) {
    return db.incident.findMany({
        where,
        include: {
            trip: { select: { id: true, scheduledStart: true } },
            bus: { select: { id: true, plateNumber: true } },
            driver: { select: { id: true, fullName: true } },
            resolvedBy: { select: { id: true, fullName: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function findIncidentById(id: string) {
    return db.incident.findFirst({
        where: { id, deletedAt: null },
        include: {
            trip: { select: { id: true, scheduledStart: true } },
            bus: { select: { id: true, plateNumber: true } },
            driver: { select: { id: true, fullName: true } },
            resolvedBy: { select: { id: true, fullName: true } },
        },
    });
}

export async function updateIncident(id: string, data: any) {
    return db.incident.update({
        where: { id },
        data,
    });
}

export async function softDeleteIncident(id: string) {
    return db.incident.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
}
