import { prisma as defaultPrisma } from '@/prisma/client';

let prisma = defaultPrisma;

export function setPrismaClient(client: any) {
    prisma = client;
}

// ============================================================
// ROUTE QUERIES
// ============================================================

export async function createRoute(data: any) {
    return prisma.route.create({ data });
}

export async function findRoutes(where: any) {
    return prisma.route.findMany({
        where,
        include: {
            versions: { where: { isActive: true, deletedAt: null }, take: 1 },
            startStop: { select: { id: true, stopName: true } },
            endStop: { select: { id: true, stopName: true } },
        },
        orderBy: { routeName: 'asc' },
    });
}

export async function findRouteById(id: string) {
    return prisma.route.findFirst({
        where: { id, deletedAt: null },
        include: {
            startStop: { select: { id: true, stopName: true } },
            endStop: { select: { id: true, stopName: true } },
        },
    });
}

export async function updateRoute(id: string, data: any) {
    return prisma.route.update({
        where: { id },
        data
    });
}

export async function softDeleteRoute(id: string) {
    return prisma.route.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
}

// ============================================================
// ROUTE VERSION QUERIES
// ============================================================

export async function findRouteVersions(routeId: string) {
    return prisma.routeVersion.findMany({
        where: { routeId, deletedAt: null },
        orderBy: { versionNumber: 'desc' },
        include: {
            routeStops: {
                where: { deletedAt: null },
                orderBy: { sequenceNumber: 'asc' },
                include: { stop: { select: { id: true, stopName: true, stopCode: true } } },
            },
        },
    });
}

export async function findLastRouteVersion(routeId: string) {
    return prisma.routeVersion.findFirst({
        where: { routeId, deletedAt: null },
        orderBy: { versionNumber: 'desc' },
    });
}

export async function createRouteVersion(data: any) {
    return prisma.routeVersion.create({ data });
}

export async function updateRouteVersion(versionId: string, data: any) {
    return prisma.routeVersion.update({
        where: { id: versionId },
        data,
    });
}

export async function findRouteVersion(versionId: string) {
    return prisma.routeVersion.findFirst({
        where: { id: versionId, deletedAt: null }
    });
}

// ============================================================
// STOP QUERIES
// ============================================================

export async function createStop(data: any) {
    return prisma.stop.create({ data });
}

export async function findStops(where: any) {
    return prisma.stop.findMany({
        where,
        orderBy: { stopName: 'asc' }
    });
}

export async function findStopById(id: string) {
    return prisma.stop.findFirst({
        where: { id, deletedAt: null }
    });
}

export async function updateStop(id: string, data: any) {
    return prisma.stop.update({
        where: { id },
        data
    });
}

export async function softDeleteStop(id: string) {
    return prisma.stop.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
}

export async function findStopsInBox(
    latMin: number,
    latMax: number,
    lngMin: number,
    lngMax: number
) {
    return prisma.stop.findMany({
        where: {
            deletedAt: null,
            latitude: { gte: latMin, lte: latMax },
            longitude: { gte: lngMin, lte: lngMax },
        },
    });
}

// ============================================================
// ROUTE STOP QUERIES
// ============================================================

export async function createRouteStop(data: any) {
    return prisma.routeStop.create({ data });
}

export async function findRouteStopsByVersion(versionId: string) {
    return prisma.routeStop.findMany({
        where: { versionId, deletedAt: null }
    });
}

// ============================================================
// TRANSACTION HELPER
// ============================================================

export async function executeTransaction(callback: (tx: any) => Promise<any>) {
    return prisma.$transaction(callback);
}
