// ================================================================
// INFRASTRUCTURE SEED: Route Stops
// ================================================================
// Purpose: Define stop sequences for each route version
// Dependency: 08-route-versions.seed.ts
// Tables: RouteStop
// ================================================================

import { PrismaClient } from '@prisma/client';

// Stop sequences for each route
const ROUTE_STOP_SEQUENCES: Record<string, string[]> = {
  'R-101': ['STOP-BOLE-01', 'STOP-BOLE-02', 'STOP-MEG-02', 'STOP-MEG-01'],
  'R-102': ['STOP-MEG-01', 'STOP-MEG-02', 'STOP-BOLE-02', 'STOP-BOLE-01'],
  'R-103': ['STOP-BOLE-01', 'STOP-BOLE-03', 'STOP-PIA-02', 'STOP-PIA-01'],
  'R-104': ['STOP-PIA-01', 'STOP-PIA-03', 'STOP-MER-01'],
  'R-105': ['STOP-MER-01', 'STOP-MER-03', 'STOP-BOLE-04', 'STOP-BOLE-01'],
  'R-106': ['STOP-MEG-01', 'STOP-MEG-03', 'STOP-PIA-01', 'STOP-MER-01'],
  'R-107': ['STOP-BOLE-01', 'STOP-SAR-01', 'STOP-LEB-01', 'STOP-AKAKI-01'],
  'R-108': ['STOP-MEG-01', 'STOP-KAZ-01', 'STOP-CMC-01', 'STOP-SAR-01'],
  'R-109': ['STOP-CMC-01', 'STOP-CMC-02', 'STOP-BOLE-02', 'STOP-BOLE-01'],
  'R-110': ['STOP-CMC-01', 'STOP-KAZ-01', 'STOP-MEG-02', 'STOP-MEG-01'],
  'R-111': ['STOP-KAL-01', 'STOP-KAL-02', 'STOP-MER-02', 'STOP-MER-01'],
  'R-112': ['STOP-KAL-01', 'STOP-KAL-02', 'STOP-BOLE-04', 'STOP-BOLE-01'],
};

function generateStopData(stops: string[], totalDistance: number, totalDuration: number) {
  const results = [];
  let accDistance = 0;
  let accTime = 0;

  for (let i = 0; i < stops.length; i++) {
    if (i === 0) {
      results.push({ stop: stops[i], seq: 1, minutes: 0, distance: 0 });
    } else {
      const segDistance = totalDistance / (stops.length - 1);
      const segTime = totalDuration / (stops.length - 1);
      accDistance += segDistance;
      accTime += segTime;
      results.push({
        stop: stops[i],
        seq: i + 1,
        minutes: Math.round(accTime),
        distance: parseFloat(accDistance.toFixed(2)),
      });
    }
  }
  return results;
}

export async function seedRouteStops(prisma: PrismaClient) {
  console.log('📍 Creating Route Stops...');

  const routes = await prisma.route.findMany();
  const versions = await prisma.routeVersion.findMany();
  const stops = await prisma.stop.findMany();

  const routeMap = Object.fromEntries(routes.map(r => [r.route_code, r.id]));
  const versionMap = Object.fromEntries(versions.map(v => {
    const route = routes.find(r => r.id === v.route_id);
    return [route?.route_code, v.id];
  }).filter(([key]) => key !== undefined));
  const stopMap = Object.fromEntries(stops.map(s => [s.stop_code, s.id]));

  let totalCreated = 0;

  for (const [routeCode, stopCodes] of Object.entries(ROUTE_STOP_SEQUENCES)) {
    const route = routes.find(r => r.route_code === routeCode);
    if (!route || !route.distance_km || !route.estimated_duration_minutes) continue;

    const versionId = versionMap[routeCode];
    if (!versionId) continue;

    const totalDistance = Number(route.distance_km);
    const totalDuration = Number(route.estimated_duration_minutes);
    const stopData = generateStopData(stopCodes, totalDistance, totalDuration);

    for (const data of stopData) {
      const stopId = stopMap[data.stop];
      if (!stopId) continue;

      try {
        await prisma.routeStop.create({
          data: {
            version_id: versionId,
            stop_id: stopId,
            sequence_number: data.seq,
            estimated_minutes: data.minutes,
            distance_km: data.distance,
          },
        });
        totalCreated++;
      } catch (error) {
        // Skip duplicate
      }
    }
  }

  console.log(`✅ ${totalCreated} route stops created`);
}