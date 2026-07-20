// ================================================================
// INFRASTRUCTURE SEED: Routes
// ================================================================
// Purpose: Create routes connecting terminals
// Dependency: 06-stops.seed.ts
// Tables: Route
// ================================================================

import { PrismaClient } from '@prisma/client';

const ROUTES = [
  { code: 'R-101', name: 'Bole - Megenagna', start: 'STOP-BOLE-01', end: 'STOP-MEG-01', distance: 12.8, duration: 45 },
  { code: 'R-102', name: 'Megenagna - Bole', start: 'STOP-MEG-01', end: 'STOP-BOLE-01', distance: 11.7, duration: 40 },
  { code: 'R-103', name: 'Bole - Piassa', start: 'STOP-BOLE-01', end: 'STOP-PIA-01', distance: 11.8, duration: 35 },
  { code: 'R-104', name: 'Piassa - Merkato', start: 'STOP-PIA-01', end: 'STOP-MER-01', distance: 3.6, duration: 10 },
  { code: 'R-105', name: 'Merkato - Bole', start: 'STOP-MER-01', end: 'STOP-BOLE-01', distance: 6.2, duration: 25 },
  { code: 'R-106', name: 'Megenagna - Merkato', start: 'STOP-MEG-01', end: 'STOP-MER-01', distance: 11.4, duration: 38 },
  { code: 'R-107', name: 'Bole - Akaki', start: 'STOP-BOLE-01', end: 'STOP-AKAKI-01', distance: 18.9, duration: 50 },
  { code: 'R-108', name: 'Megenagna - Saris', start: 'STOP-MEG-01', end: 'STOP-SAR-01', distance: 14.7, duration: 42 },
  { code: 'R-109', name: 'CMC - Bole', start: 'STOP-CMC-01', end: 'STOP-BOLE-01', distance: 9.8, duration: 30 },
  { code: 'R-110', name: 'CMC - Megenagna', start: 'STOP-CMC-01', end: 'STOP-MEG-01', distance: 11.2, duration: 35 },
  { code: 'R-111', name: 'Kality - Merkato', start: 'STOP-KAL-01', end: 'STOP-MER-01', distance: 8.9, duration: 28 },
  { code: 'R-112', name: 'Kality - Bole', start: 'STOP-KAL-01', end: 'STOP-BOLE-01', distance: 10.3, duration: 32 },
];

export async function seedRoutes(prisma: PrismaClient) {
  console.log('🛤️ Creating Routes...');

  const stops = await prisma.stop.findMany();
  const stopMap = Object.fromEntries(stops.map(s => [s.stop_code, s.id]));

  let created = 0;
  for (const r of ROUTES) {
    const startId = stopMap[r.start];
    const endId = stopMap[r.end];
    if (!startId || !endId) {
      console.warn(`   ⚠️ Skipping route ${r.code}: stops not found`);
      continue;
    }

    try {
      await prisma.route.create({
        data: {
          route_code: r.code,
          route_name: r.name,
          description: `Connects ${r.name}`,
          status: 'ACTIVE',
          distance_km: r.distance,
          estimated_duration_minutes: r.duration,
          start_stop_id: startId,
          end_stop_id: endId,
        },
      });
      created++;
    } catch (error) {
      console.warn(`   ⚠️ Could not create route ${r.code}: ${error}`);
    }
  }

  console.log(`✅ ${created} routes created`);
}