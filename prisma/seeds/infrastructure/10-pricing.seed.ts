// ================================================================
// INFRASTRUCTURE SEED: Pricing
// ================================================================
// Purpose: Create dynamic distance-based pricing
// Dependency: 09-route-stops.seed.ts
// Tables: Pricing
// ================================================================

import { PrismaClient } from '@prisma/client';

function calculatePrice(distanceKm: number): { base: number; peak: number; off: number } {
  const base = Math.round((5 + distanceKm * 1.5) / 5) * 5;
  return {
    base: Math.max(base, 10),
    peak: Math.round(base * 1.5 / 5) * 5,
    off: Math.round(base * 0.8 / 5) * 5,
  };
}

export async function seedPricing(prisma: PrismaClient) {
  console.log('💰 Creating Pricing...');

  const routes = await prisma.route.findMany();
  const versions = await prisma.routeVersion.findMany();
  const routeStops = await prisma.routeStop.findMany({
    orderBy: { sequence_number: 'asc' },
  });

  const versionMap = Object.fromEntries(versions.map(v => {
    const route = routes.find(r => r.id === v.route_id);
    return [route?.route_code, v.id];
  }).filter(([key]) => key !== undefined));

  const routeMap = Object.fromEntries(routes.map(r => [r.route_code, r.id]));
  const stopMap = Object.fromEntries(routeStops.map(rs => [rs.stop_id, rs]));

  let totalCreated = 0;

  for (const route of routes) {
    const routeStopsForRoute = routeStops.filter(rs => {
      const version = versions.find(v => v.id === rs.version_id);
      return version?.route_id === route.id;
    });

    if (routeStopsForRoute.length < 2) continue;

    const versionId = versionMap[route.route_code];
    if (!versionId) continue;

    for (let i = 0; i < routeStopsForRoute.length - 1; i++) {
      const fromStop = routeStopsForRoute[i];
      const toStop = routeStopsForRoute[i + 1];
      const fromDistance = Number(fromStop.distance_km);
      const toDistance = Number(toStop.distance_km);
      if (Number.isNaN(fromDistance) || Number.isNaN(toDistance)) continue;
      const distance = toDistance - fromDistance;
      const price = calculatePrice(distance);

      try {
        await prisma.pricing.create({
          data: {
            route_id: route.id,
            route_version_id: versionId,
            from_stop_id: fromStop.stop_id,
            to_stop_id: toStop.stop_id,
            base_price: price.base,
            peak_price: price.peak,
            off_peak_price: price.off,
            currency: 'ETB',
            effective_from: new Date('2024-01-01'),
            effective_to: null,
            status: 'ACTIVE',
          },
        });
        totalCreated++;
      } catch (error) {
        // Skip duplicate
      }
    }
  }

  console.log(`✅ ${totalCreated} pricing records created`);
}