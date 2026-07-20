// ================================================================
// SAMPLE SEED: Incidents
// ================================================================
// Purpose: Create a small set of sample incidents for UI testing
// Dependency: infrastructure phase (buses must exist)
// Tables: Incident
//
// This file was previously a stub — it logged a message and did
// nothing, even though seed.ts's summary claimed sample incidents
// were being created. Since no Trip seed exists yet either, these
// incidents attach to a Bus only (trip_id is nullable on Incident),
// which is enough for UI/API development against the Incident table.
//
// DATA PROVENANCE: entirely simulated, not real events.
// ================================================================

import type { PrismaClient } from '@prisma/client';

const SAMPLE_INCIDENTS: Array<{
  type: 'BREAKDOWN' | 'ACCIDENT' | 'TRAFFIC' | 'FLAT_TIRE' | 'DRIVER_ISSUE';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  description: string;
  resolution_notes?: string;
}> = [
  { type: 'BREAKDOWN', severity: 'HIGH', status: 'RESOLVED', description: 'Engine overheating on route', resolution_notes: 'Mechanic dispatched, bus repaired on-site' },
  { type: 'FLAT_TIRE', severity: 'MEDIUM', status: 'RESOLVED', description: 'Rear tire burst near terminal', resolution_notes: 'Tire replaced, bus returned to service' },
  { type: 'TRAFFIC', severity: 'LOW', status: 'CLOSED', description: 'Heavy congestion delayed arrival by 20 minutes' },
  { type: 'ACCIDENT', severity: 'CRITICAL', status: 'IN_PROGRESS', description: 'Minor collision with a private vehicle, under investigation' },
  { type: 'DRIVER_ISSUE', severity: 'LOW', status: 'OPEN', description: 'Driver reported feeling unwell mid-shift' },
];

export async function seedSampleIncidents(prisma: PrismaClient) {
  console.log('🚨 Creating sample Incidents (simulated, not real events)...');

  const buses = await prisma.bus.findMany({ take: SAMPLE_INCIDENTS.length });
  const admin = await prisma.user.findFirst({
    where: { roles: { some: { role: { role_name: 'Administrator' } } } },
  });

  if (buses.length === 0) {
    console.warn('   ⚠️ No buses found — skipping sample incidents (run 12-buses.seed.ts first)');
    return;
  }

  let created = 0;
  for (let i = 0; i < SAMPLE_INCIDENTS.length; i++) {
    const sample = SAMPLE_INCIDENTS[i];
    const bus = buses[i % buses.length];
    const isResolved = sample.status === 'RESOLVED' || sample.status === 'CLOSED';

    try {
      await prisma.incident.create({
        data: {
          bus_id: bus.id,
          incident_type: sample.type,
          severity: sample.severity,
          status: sample.status,
          description: sample.description,
          resolution_notes: sample.resolution_notes ?? null,
          resolved_by: isResolved ? admin?.id ?? null : null,
          resolved_at: isResolved ? new Date() : null,
        },
      });
      created++;
    } catch (error) {
      console.warn(`   ⚠️ Could not create sample incident: ${error}`);
    }
  }

  console.log(`✅ ${created} sample incidents created`);
}
