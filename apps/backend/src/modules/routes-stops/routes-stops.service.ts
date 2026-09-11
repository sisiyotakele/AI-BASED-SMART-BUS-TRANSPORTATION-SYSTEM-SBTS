import { NotFoundError, ConflictError, BadRequestError } from '@/common/errors';
import { logger } from '@/common/logger';
import * as repository from './routes-stops.repository';

export function setPrismaClient(client: any) {
  repository.setPrismaClient(client);
}

// ============================================================
// ROUTES
// ============================================================

export async function createRoute(data: any, _actorId?: string) {
  const route = await repository.executeTransaction(async (tx) => {
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
  return repository.findRoutes(where);
}

function normalizePlace(value: string): string {
  return value.toLowerCase().replace(/\bpiassa\b/g, 'piazza').replace(/\b(station|terminal|hub|square)\b/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
}

function placeMatches(place: string, stopName: string): boolean {
  const normalizedPlace = normalizePlace(place);
  const normalizedStop = normalizePlace(stopName);
  return normalizedPlace === normalizedStop || normalizedPlace.includes(normalizedStop) || normalizedStop.includes(normalizedPlace);
}

function routeStops(route: any): any[] {
  return route.versions?.[0]?.routeStops || [];
}

function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const earthRadiusKm = 6371;
  const latDelta = (lat2 - lat1) * Math.PI / 180;
  const lonDelta = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(lonDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function geocodePlace(place: string): Promise<{ lat: number; lon: number; displayName: string }> {
  const params = new URLSearchParams({ q: `${place}, Addis Ababa, Ethiopia`, format: 'jsonv2', limit: '1' });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
    headers: { 'User-Agent': 'SBTS-route-planner/1.0 (presentation project)' },
  });
  if (!response.ok) throw new BadRequestError('Address geocoding service unavailable', 'GEOCODING_UNAVAILABLE');
  const results = await response.json() as Array<{ lat: string; lon: string; display_name: string }>;
  const match = results[0];
  if (!match) throw new BadRequestError(`Could not locate "${place}"`, 'PLACE_NOT_FOUND');
  return { lat: Number(match.lat), lon: Number(match.lon), displayName: match.display_name };
}

async function nearestStop(lat: number, lon: number) {
  const stops = await repository.findAllActiveStops();
  const match = stops
    .map((stop) => ({ stop, distanceKm: distanceKm(lat, lon, Number(stop.latitude), Number(stop.longitude)) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0];
  if (!match) throw new BadRequestError('No bus stops are available for routing', 'NO_STOPS_AVAILABLE');
  return match;
}

function routeOption(route: any, origin: any, destination: any, transfer?: any) {
  const stops = routeStops(route);
  const fromIndex = stops.findIndex((item) => item.stop.id === origin.stop.id);
  const toIndex = stops.findIndex((item) => item.stop.id === destination.stop.id);
  const start = Math.max(0, fromIndex);
  const end = toIndex >= start ? toIndex : stops.length - 1;
  const selectedStops = stops.slice(start, end + 1);
  const duration = selectedStops[selectedStops.length - 1]?.estimatedMinutes || 25;
  const fare = 15;
  return {
    id: route.id,
    isMergedRoute: Boolean(transfer),
    transfersCount: transfer ? 1 : 0,
    busNumber: route.routeName,
    busType: transfer ? 'Database Route Transfer' : 'Scheduled Service',
    nearestStation: {
      id: origin.stop.id,
      name: origin.stop.stopName,
      distanceMeters: 250,
      walkTimeMinutes: 4,
      coords: { lat: Number(origin.stop.latitude || 9.02), lng: Number(origin.stop.longitude || 38.79) },
    },
    busEtaMinutes: 4,
    totalTripMinutes: duration,
    fare: `${fare}.00 ETB`,
    crowdLevel: 'Medium',
    routeVia: selectedStops.map((item) => item.stop.stopName).join(' → '),
    legs: transfer ? [
      { legIndex: 1, fromStation: origin.stop.stopName, toStation: transfer.stop.stopName, busNumber: route.routeName, busType: 'Scheduled Service', departureEtaMinutes: 4, durationMinutes: duration, fare: `${fare}.00 ETB` },
      { legIndex: 2, fromStation: transfer.stop.stopName, toStation: destination.stop.stopName, busNumber: transfer.route.routeName, busType: 'Scheduled Service', departureEtaMinutes: 5, durationMinutes: transfer.duration, fare: `${fare}.00 ETB`, transferWaitMinutes: 5 },
    ] : undefined,
  };
}

export async function planRoute(origin: string, destination: string) {
  const routes = await repository.findPlannableRoutes();
  const directOptions: any[] = [];
  const originRoutes: any[] = [];
  const destinationRoutes: any[] = [];

  for (const route of routes) {
    const stops = routeStops(route);
    const originIndex = stops.findIndex((item) => placeMatches(origin, item.stop.stopName));
    const destinationIndex = stops.findIndex((item) => placeMatches(destination, item.stop.stopName));
    if (originIndex >= 0) originRoutes.push({ route, stops, originIndex });
    if (destinationIndex >= 0) destinationRoutes.push({ route, stops, destinationIndex });
    if (originIndex >= 0 && destinationIndex >= originIndex) {
      directOptions.push(routeOption(route, stops[originIndex], stops[destinationIndex]));
    }
  }

  if (directOptions.length > 0) {
    const uniqueDirect = directOptions.filter(
      (opt, index, self) => index === self.findIndex((t) => t.busNumber === opt.busNumber || t.id === opt.id)
    );
    return uniqueDirect;
  }

  const transfers: any[] = [];
  for (const first of originRoutes) {
    for (const second of destinationRoutes) {
      if (first.route.id === second.route.id) continue;
      const firstStopIds = new Set(first.stops.slice(first.originIndex).map((item: any) => item.stop.id));
      const transferCandidates: Array<{ item: any; index: number }> = second.stops
        .map((item: any, index: number) => ({ item, index }))
        .filter(({ item, index }: { item: any; index: number }) => firstStopIds.has(item.stop.id) && index < second.destinationIndex);
      const transfer: { route: any; stop: any; duration: number; totalDuration: number } | undefined = transferCandidates
        .map(({ item }) => {
          const firstDuration = first.stops[first.stops.findIndex((stop: any) => stop.stop.id === item.stop.id)]?.estimatedMinutes || 25;
          const secondDuration = (second.stops[second.destinationIndex]?.estimatedMinutes || 25) - (item.estimatedMinutes || 0);
          return { route: second.route, stop: item.stop, duration: Math.max(10, secondDuration), totalDuration: firstDuration + Math.max(10, secondDuration) + 5 };
        })
        .sort((a: { totalDuration: number }, b: { totalDuration: number }) => a.totalDuration - b.totalDuration)[0];
      if (transfer) {
        const originStop = first.stops[first.originIndex];
        const destinationStop = second.stops[second.destinationIndex];
        const transferOption = routeOption(first.route, originStop, transfer, {
          route: second.route,
          stop: transfer.stop,
          duration: transfer.duration,
        });
        transferOption.busNumber = `${first.route.routeName} → ${second.route.routeName}`;
        transferOption.routeVia = `${originStop.stop.stopName} → ${transfer.stop.stopName} → ${destinationStop.stop.stopName}`;
        if (transferOption.legs?.[1]) {
          transferOption.legs[1].toStation = destinationStop.stop.stopName;
        }
        transferOption.totalTripMinutes += transferOption.legs?.[1]?.durationMinutes || 0;
        transferOption.totalTripMinutes += transferOption.legs?.[1]?.transferWaitMinutes || 0;
        transferOption.fare = '30.00 ETB';
        transfers.push(transferOption);
      }
    }
  }
  const uniqueTransfers = transfers.filter(
    (opt, index, self) => index === self.findIndex((t) => t.busNumber === opt.busNumber && t.routeVia === opt.routeVia)
  );
  return uniqueTransfers;
}

export async function planAddressRoute(origin: string, destination: string) {
  const [originPlace, destinationPlace] = await Promise.all([
    geocodePlace(origin),
    geocodePlace(destination),
  ]);
  const [originStop, destinationStop] = await Promise.all([
    nearestStop(originPlace.lat, originPlace.lon),
    nearestStop(destinationPlace.lat, destinationPlace.lon),
  ]);
  const routes = await planRoute(originStop.stop.stopName, destinationStop.stop.stopName);
  return {
    routes,
    origin: { query: origin, ...originPlace, nearestStop: originStop.stop.stopName, distanceKm: originStop.distanceKm },
    destination: { query: destination, ...destinationPlace, nearestStop: destinationStop.stop.stopName, distanceKm: destinationStop.distanceKm },
  };
}

export async function getRouteById(id: string) {
  const route = await repository.findRouteById(id);
  if (!route) throw new NotFoundError('Route not found', 'ROUTE_NOT_FOUND');
  return route;
}

export async function getRouteVersions(id: string) {
  await getRouteById(id);
  return repository.findRouteVersions(id);
}

export async function updateRoute(id: string, data: any) {
  await getRouteById(id);
  const route = await repository.updateRoute(id, data);
  logger.info('Route updated', { routeId: id });
  return route;
}

export async function createNewRouteVersion(id: string, data: { routeStops?: any[] }, actorId?: string) {
  const route = await getRouteById(id);
  return repository.executeTransaction(async (tx) => {
    const lastVersion = await repository.findLastRouteVersion(id);
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

export async function listStops(search?: string) {
  const where: any = { deletedAt: null };
  if (search) {
    where.OR = [
      { stopName: { contains: search, mode: 'insensitive' } },
      { stopCode: { contains: search, mode: 'insensitive' } },
    ];
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
