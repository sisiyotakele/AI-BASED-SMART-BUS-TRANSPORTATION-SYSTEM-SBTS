import { prisma as defaultPrisma } from '@/prisma/client';
import { NotFoundError, ConflictError, BadRequestError } from '@/common/errors';
import { logger } from '@/common/logger';

let prisma = defaultPrisma;

export function setPrismaClient(client: any) {
  prisma = client;
}

// ============================================================
// ROUTES
// ============================================================

export async function createRoute(data: any, _actorId?: string) {
  const route = await prisma.$transaction(async (tx) => {
    const newRoute = await tx.route.create({
      data: {
        routeName: data.routeName,
        description: data.description,
        startStopId: data.startStopId,
        endStopId: data.endStopId,
      },
    });
    await tx.routeVersion.create({
      data: {
        routeId: newRoute.id,
        versionNumber: 1,
        isActive: true,
        effectiveFrom: new Date(),
      },
    });
    return newRoute;
  });
  logger.info('Route created with initial version', { routeId: route.id });
  return route;
}

export async function listRoutes(search?: string) {
  const where: any = { deletedAt: null };
  if (search) {
    where.OR = [
      { routeName: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
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

export async function getRouteById(id: string) {
  const route = await prisma.route.findFirst({
    where: { id, deletedAt: null },
    include: {
      startStop: { select: { id: true, stopName: true } },
      endStop: { select: { id: true, stopName: true } },
    },
  });
  if (!route) throw new NotFoundError('Route not found', 'ROUTE_NOT_FOUND');
  return route;
}

export async function getRouteVersions(id: string) {
  await getRouteById(id);
  return prisma.routeVersion.findMany({
    where: { routeId: id, deletedAt: null },
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

export async function updateRoute(id: string, data: any) {
  await getRouteById(id);
  const route = await prisma.route.update({ where: { id }, data });
  logger.info('Route updated', { routeId: id });
  return route;
}

export async function createNewRouteVersion(id: string, data: { routeStops?: any[] }, actorId?: string) {
  const route = await getRouteById(id);
  return prisma.$transaction(async (tx) => {
    const lastVersion = await tx.routeVersion.findFirst({
      where: { routeId: id, deletedAt: null },
      orderBy: { versionNumber: 'desc' },
    });
    const newVersionNumber = (lastVersion?.versionNumber || 0) + 1;

    // Deactivate old version
    if (lastVersion) {
      await tx.routeVersion.update({
        where: { id: lastVersion.id },
        data: { isActive: false, effectiveUntil: new Date() },
      });
    }

    // Create new version
    const newVersion = await tx.routeVersion.create({
      data: {
        routeId: id,
        versionNumber: newVersionNumber,
        isActive: true,
        effectiveFrom: new Date(),
      },
    });

    // Copy route stops if provided, else copy from last version
    if (data.routeStops && data.routeStops.length > 0) {
      for (const rs of data.routeStops) {
        await tx.routeStop.create({
          data: {
            versionId: newVersion.id,
            stopId: rs.stopId,
            sequenceNumber: rs.sequenceNumber,
            estimatedMinutes: rs.estimatedMinutes,
            distanceKm: rs.distanceKm,
          },
        });
      }
    } else if (lastVersion) {
      const oldStops = await tx.routeStop.findMany({ where: { versionId: lastVersion.id, deletedAt: null } });
      for (const rs of oldStops) {
        await tx.routeStop.create({
          data: {
            versionId: newVersion.id,
            stopId: rs.stopId,
            sequenceNumber: rs.sequenceNumber,
            estimatedMinutes: rs.estimatedMinutes,
            distanceKm: rs.distanceKm,
          },
        });
      }
    }

    logger.info('New route version created', { routeId: id, versionId: newVersion.id, versionNumber: newVersionNumber });
    return newVersion;
  });
}

export async function deleteRoute(id: string, _actorId?: string) {
  await getRouteById(id);
  const route = await prisma.route.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  logger.info('Route soft-deleted', { routeId: id });
  return route;
}

// ============================================================
// STOPS
// ============================================================

export async function createStop(data: any, _actorId?: string) {
  try {
    const stop = await prisma.stop.create({ data });
    logger.info('Stop created', { stopId: stop.id });
    return stop;
  } catch (e: any) {
    if (e.code === 'P2002') throw new ConflictError('Stop code already exists', 'STOP_CODE_EXISTS');
    throw e;
  }
}

export async function listStops(search?: string) {
  const where: any = { deletedAt: null };
  if (search) {
    where.OR = [
      { stopName: { contains: search, mode: 'insensitive' } },
      { stopCode: { contains: search, mode: 'insensitive' } },
    ];
  }
  return prisma.stop.findMany({ where, orderBy: { stopName: 'asc' } });
}

export async function getStopById(id: string) {
  const stop = await prisma.stop.findFirst({ where: { id, deletedAt: null } });
  if (!stop) throw new NotFoundError('Stop not found', 'STOP_NOT_FOUND');
  return stop;
}

export async function updateStop(id: string, data: any) {
  await getStopById(id);
  try {
    const stop = await prisma.stop.update({ where: { id }, data });
    logger.info('Stop updated', { stopId: id });
    return stop;
  } catch (e: any) {
    if (e.code === 'P2002') throw new ConflictError('Stop code already exists', 'STOP_CODE_EXISTS');
    throw e;
  }
}

export async function deleteStop(id: string, _actorId?: string) {
  await getStopById(id);
  const stop = await prisma.stop.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  logger.info('Stop soft-deleted', { stopId: id });
  return stop;
}

export async function findNearbyStops(lat: number, lng: number, radiusKm: number) {
  // Simple box filter + Haversine ordering (production would use PostGIS)
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

  const stops = await prisma.stop.findMany({
    where: {
      deletedAt: null,
      latitude: { gte: lat - latDelta, lte: lat + latDelta },
      longitude: { gte: lng - lngDelta, lte: lng + lngDelta },
    },
  });

  return stops
    .map((s: any) => {
      const dLat = ((s.latitude as any) - lat) * Math.PI / 180;
      const dLng = ((s.longitude as any) - lng) * Math.PI / 180;
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat * Math.PI / 180) * Math.cos((s.latitude as any) * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = 6371 * c;
      return { ...s, distanceKm: distance };
    })
    .filter((s: any) => s.distanceKm <= radiusKm)
    .sort((a: any, b: any) => a.distanceKm - b.distanceKm);
}

// ============================================================
// ROUTE STOPS
// ============================================================

export async function addRouteStop(versionId: string, data: any) {
  const version = await prisma.routeVersion.findFirst({ where: { id: versionId, deletedAt: null } });
  if (!version) throw new NotFoundError('Route version not found', 'VERSION_NOT_FOUND');
  if (version.isActive) throw new BadRequestError('Cannot modify an active version. Create a new version first.');

  const rs = await prisma.routeStop.create({
    data: {
      versionId,
      stopId: data.stopId,
      sequenceNumber: data.sequenceNumber,
      estimatedMinutes: data.estimatedMinutes,
      distanceKm: data.distanceKm,
    },
  });
  logger.info('Route stop added', { versionId, stopId: data.stopId });
  return rs;
}
