import { NotFoundError, ConflictError, BadRequestError } from '@/common/errors';
import { logger } from '@/common/logger';
import { prisma } from '@/prisma/client';

import * as repository from './routes-stops.repository';


export function setPrismaClient(client: any) {
  repository.setPrismaClient(client);
}

// ============================================================
// ROUTES
// ============================================================

export async function createRoute(data: any, _actorId?: string) {
  // Validate terminal IDs are provided
  if (!data.startTerminalId || !data.endTerminalId) {
    throw new BadRequestError('Start and end terminals are required', 'MISSING_TERMINALS');
  }

  if (data.startTerminalId === data.endTerminalId) {
    throw new BadRequestError('Start and end terminals must be different', 'SAME_TERMINALS');
  }

  // Check for duplicate route (same start and end terminals)
  const existingRoute = await repository.findRoutes({
    startTerminalId: data.startTerminalId,
    endTerminalId: data.endTerminalId,
    deletedAt: null
  });

  if (existingRoute && existingRoute.length > 0) {
    throw new ConflictError(
      `A route from "${existingRoute[0].startTerminal?.terminalName}" to "${existingRoute[0].endTerminal?.terminalName}" already exists`,
      'ROUTE_ALREADY_EXISTS'
    );
  }

  // Get terminal names for bidirectional route name
  const [startTerminal, endTerminal] = await Promise.all([
    repository.findTerminalById(data.startTerminalId),
    repository.findTerminalById(data.endTerminalId)
  ]);

  if (!startTerminal || !endTerminal) {
    throw new BadRequestError('Invalid terminal IDs provided', 'INVALID_TERMINALS');
  }

  const route = await repository.executeTransaction(async (tx) => {
    // Create bidirectional route
    const newRoute = await tx.route.create({
      data: {
        routeName: `${startTerminal.terminalName} ↔ ${endTerminal.terminalName}`,
        description: data.description,
        startTerminalId: data.startTerminalId,
        endTerminalId: data.endTerminalId,
        status: data.status || 'active',
      },
      include: {
        startTerminal: {
          select: {
            id: true,
            terminalName: true,
            address: true
          }
        },
        endTerminal: {
          select: {
            id: true,
            terminalName: true,
            address: true
          }
        }
      }
    });

    // Create PRIMARY route for FORWARD direction (Route 1)
    await tx.routeVersion.create({
      data: {
        routeId: newRoute.id,
        versionNumber: 1,
        versionName: 'Route 1',
        direction: 'forward',
        isPrimary: true,
        isActive: true,
        effectiveFrom: new Date(),
      },
    });

    // Create PRIMARY route for BACKWARD direction (Route 1)
    await tx.routeVersion.create({
      data: {
        routeId: newRoute.id,
        versionNumber: 1,
        versionName: 'Route 1',
        direction: 'backward',
        isPrimary: true,
        isActive: false, // Backward starts inactive until stops are added
        effectiveFrom: new Date(),
      },
    });

    return newRoute;
  });

  logger.info('Bidirectional route created with forward and backward Route 1', {
    routeId: route.id,
    routeName: route.routeName
  });

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
  const results = await repository.findRoutes(where);
  return results.map(r => {
    const activeVersion = r.versions && r.versions.length > 0 ? r.versions[0] : null;
    return {
      ...r,
      stopCount: activeVersion && activeVersion.routeStops ? activeVersion.routeStops.length : 0
    };
  });
}

export async function getRouteById(id: string) {
  const route = await repository.findRouteById(id);
  if (!route) throw new NotFoundError('Route not found', 'ROUTE_NOT_FOUND');
  return route;
}

export async function getRouteVersions(id: string) {
  await getRouteById(id);
  const versions = await repository.findRouteVersions(id);

  // Group by direction and format for frontend
  const forward = versions
    .filter(v => v.direction === 'forward')
    .map(v => ({
      id: v.id,
      routeNumber: v.versionNumber,
      routeName: v.versionName || `Route ${v.versionNumber}`,
      isPrimary: v.isPrimary,
      isActive: v.isActive,
      effectiveFrom: v.effectiveFrom,
      effectiveUntil: v.effectiveUntil,
      stopCount: v.routeStops?.length || 0,
      routeStops: v.routeStops,
      schedules: (v as any).schedules || [],
      createdAt: v.createdAt,
      updatedAt: v.updatedAt
    }));

  const backward = versions
    .filter(v => v.direction === 'backward')
    .map(v => ({
      id: v.id,
      routeNumber: v.versionNumber,
      routeName: v.versionName || `Route ${v.versionNumber}`,
      isPrimary: v.isPrimary,
      isActive: v.isActive,
      effectiveFrom: v.effectiveFrom,
      effectiveUntil: v.effectiveUntil,
      stopCount: v.routeStops?.length || 0,
      routeStops: v.routeStops,
      schedules: (v as any).schedules || [],
      createdAt: v.createdAt,
      updatedAt: v.updatedAt
    }));

  return {
    forward,
    backward
  };
}

export async function updateRoute(id: string, data: any) {
  await getRouteById(id);
  const route = await repository.updateRoute(id, data);
  logger.info('Route updated', { routeId: id });
  return route;
}

export async function deleteRouteVersion(versionId: string, userId?: string) {
  const version = await prisma.routeVersion.findUnique({
    where: { id: versionId }
  });

  if (!version) {
    throw new NotFoundError('Route version not found');
  }

  if (version.isActive) {
    throw new BadRequestError('Cannot delete an active route. Please deactivate it first.');
  }

  if (version.isPrimary) {
    throw new BadRequestError('Cannot delete the primary route (Route 1)');
  }

  await prisma.routeVersion.update({
    where: { id: versionId },
    data: { deletedAt: new Date() }
  });

  logger.info('Route version deleted', { versionId, userId });
}

export async function toggleRouteVersionStatus(versionId: string, activate: boolean, userId?: string) {
  const version = await prisma.routeVersion.findUnique({
    where: { id: versionId }
  });

  if (!version) {
    throw new NotFoundError('Route version not found');
  }

  await prisma.routeVersion.update({
    where: { id: versionId },
    data: {
      isActive: activate,
      effectiveFrom: activate ? new Date() : version.effectiveFrom,
      effectiveUntil: activate ? null : new Date()
    }
  });

  logger.info(`Route version ${activate ? 'activated' : 'deactivated'}`, { versionId, userId });
}



export async function createNewRouteVersion(
  id: string,
  data: {
    direction: 'forward' | 'backward',
    routeStops?: any[],
    versionName?: string
  },
  actorId?: string
) {
  const route = await getRouteById(id);

  return repository.executeTransaction(async (tx) => {
    // Get existing routes for this direction to determine next route number
    const existingVersions = await tx.routeVersion.findMany({
      where: {
        routeId: id,
        direction: data.direction,
        deletedAt: null
      },
      orderBy: { versionNumber: 'desc' }
    });

    const nextRouteNumber = (existingVersions[0]?.versionNumber || 0) + 1;
    const routeName = data.versionName || `Route ${nextRouteNumber}`;

    // Create new route variant
    const newVersion = await tx.routeVersion.create({
      data: {
        routeId: id,
        versionNumber: nextRouteNumber,
        versionName: routeName,
        direction: data.direction,
        isPrimary: nextRouteNumber === 1, // First route is always primary
        isActive: false, // New route variants start inactive
        effectiveFrom: new Date(),
      },
    });

    // Add route stops if provided
    if (data.routeStops && data.routeStops.length > 0) {
      for (const rs of data.routeStops) {
        await tx.routeStop.create({
          data: {
            versionId: newVersion.id,
            stopId: rs.stopId,
            sequenceNumber: rs.sequenceNumber,
            estimatedMinutes: rs.estimatedMinutes || 0,
            distanceKm: rs.distanceKm || 0,
          },
        });
      }
    }

    logger.info('New route variant created', {
      routeId: id,
      versionId: newVersion.id,
      routeNumber: nextRouteNumber,
      direction: data.direction,
      routeName
    });

    return newVersion;
  });
}

export async function deleteRoute(id: string, _actorId?: string) {
  await getRouteById(id);
  const route = await repository.softDeleteRoute(id);
  logger.info('Route soft-deleted', { routeId: id });
  return route;
}

// ============================================================
// STOPS
// ============================================================

export async function createStop(data: any, _actorId?: string) {
  try {
    const stop = await repository.createStop(data);
    logger.info('Stop created', { stopId: stop.id });
    return stop;
  } catch (e: any) {
    if (e.code === 'P2002') throw new ConflictError('Stop code already exists', 'STOP_CODE_EXISTS');
    throw e;
  }
}

export async function listStops(search?: string, terminalId?: string) {
  const where: any = { deletedAt: null };
  if (search) {
    where.OR = [
      { stopName: { contains: search, mode: 'insensitive' } },
      { stopCode: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (terminalId) {
    where.terminalId = terminalId;
  }
  return repository.findStops(where);
}

export async function getStopById(id: string) {
  const stop = await repository.findStopById(id);
  if (!stop) throw new NotFoundError('Stop not found', 'STOP_NOT_FOUND');
  return stop;
}

export async function updateStop(id: string, data: any) {
  await getStopById(id);
  try {
    const stop = await repository.updateStop(id, data);
    logger.info('Stop updated', { stopId: id });
    return stop;
  } catch (e: any) {
    if (e.code === 'P2002') throw new ConflictError('Stop code already exists', 'STOP_CODE_EXISTS');
    throw e;
  }
}

export async function deleteStop(id: string, _actorId?: string) {
  await getStopById(id);
  const stop = await repository.softDeleteStop(id);
  logger.info('Stop soft-deleted', { stopId: id });
  return stop;
}

export async function findNearbyStops(lat: number, lng: number, radiusKm: number) {
  // Simple box filter + Haversine ordering (production would use PostGIS)
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

  const stops = await repository.findStopsInBox(
    lat - latDelta,
    lat + latDelta,
    lng - lngDelta,
    lng + lngDelta
  );

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
  const version = await repository.findRouteVersion(versionId);
  if (!version) throw new NotFoundError('Route version not found', 'VERSION_NOT_FOUND');
  if (version.isActive) throw new BadRequestError('Cannot modify an active version. Create a new version first.');

  const rs = await repository.createRouteStop({
    versionId,
    stopId: data.stopId,
    sequenceNumber: data.sequenceNumber,
    estimatedMinutes: data.estimatedMinutes,
    distanceKm: data.distanceKm,
  });
  logger.info('Route stop added', { versionId, stopId: data.stopId });
  return rs;
}

export async function overwriteVersionStops(versionId: string, data: { routeStops: any[] }) {
  const version = await repository.findRouteVersion(versionId);
  if (!version) throw new NotFoundError('Route version not found', 'VERSION_NOT_FOUND');

  return repository.executeTransaction(async (tx) => {
    // Delete all existing stops for this version
    await tx.routeStop.deleteMany({
      where: { versionId }
    });

    const createdStops = [];
    if (data.routeStops && data.routeStops.length > 0) {
      for (const rs of data.routeStops) {
        const row = await tx.routeStop.create({
          data: {
            versionId: versionId,
            stopId: rs.stopId,
            sequenceNumber: rs.sequenceNumber,
            estimatedMinutes: rs.estimatedMinutes,
            distanceKm: rs.distanceKm,
          },
        });
        createdStops.push(row);
      }
    }

    logger.info('Overwrote route stops for draft version', { versionId, stopsCount: createdStops.length });
    return createdStops;
  });
}
