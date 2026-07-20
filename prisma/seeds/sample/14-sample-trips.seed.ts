// ================================================================
// SAMPLE SEED: Trips
// ================================================================
// Purpose: Create a small set of sample trips for UI/API testing
// Dependency: infrastructure phase (schedules, buses, drivers)
// Tables: Trip
//
// This file was previously a stub. Trip requires a non-null
// schedule_id and version_id, so this pulls a handful of real
// Schedule rows and attaches a random bus/driver to each one,
// spread across "yesterday" through "tomorrow" so the UI has a mix
// of past, current, and future trips to render.
//
// DATA PROVENANCE: entirely simulated, not real telemetry.
// ================================================================

import type { PrismaClient } from '@prisma/client';

const SAMPLE_TRIP_COUNT = 10;

export async function seedSampleTrips(prisma: PrismaClient) {
  console.log('🚍 Creating sample Trips (simulated)...');

  const schedules = await prisma.schedule.findMany({ take: 50 });
  const buses = await prisma.bus.findMany({ where: { status: 'ACTIVE' } });
  const drivers = await prisma.user.findMany({
    where: { roles: { some: { role: { role_name: 'Driver' } } } },
  });

  if (schedules.length === 0 || buses.length === 0 || drivers.length === 0) {
    console.warn('   ⚠️ Missing schedules, buses, or drivers — skipping sample trips');
    return;
  }

  const statuses: Array<'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED'> = [
    'COMPLETED', 'COMPLETED', 'IN_PROGRESS', 'SCHEDULED', 'DELAYED',
  ];

  let created = 0;
  for (let i = 0; i < SAMPLE_TRIP_COUNT; i++) {
    const schedule = schedules[i % schedules.length];
    const bus = buses[Math.floor(Math.random() * buses.length)];
    const driver = drivers[Math.floor(Math.random() * drivers.length)];
    const status = statuses[i % statuses.length];

    const dayOffset = Math.floor(i / (SAMPLE_TRIP_COUNT / 3)) - 1; // -1, 0, +1 days
    const [depH, depM] = schedule.departure_time.split(':').map(Number);
    const scheduledStart = new Date();
    scheduledStart.setDate(scheduledStart.getDate() + dayOffset);
    scheduledStart.setHours(depH, depM, 0, 0);

    const scheduledEnd = new Date(scheduledStart);
    if (schedule.arrival_time) {
      const [arrH, arrM] = schedule.arrival_time.split(':').map(Number);
      scheduledEnd.setHours(arrH, arrM, 0, 0);
    } else {
      scheduledEnd.setMinutes(scheduledEnd.getMinutes() + 30);
    }

    const actualStart = status !== 'SCHEDULED' ? new Date(scheduledStart.getTime() + Math.random() * 300000) : null;
    const actualEnd = status === 'COMPLETED' ? new Date(scheduledEnd.getTime() + Math.random() * 300000) : null;

    try {
      await prisma.trip.create({
        data: {
          bus_id: bus.id,
          driver_id: driver.id,
          version_id: schedule.version_id,
          schedule_id: schedule.id,
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd,
          actual_start: actualStart,
          actual_end: actualEnd,
          status,
          routeId: schedule.route_id,
        },
      });
      created++;
    } catch (error) {
      console.warn(`   ⚠️ Could not create sample trip: ${error}`);
    }
  }

  console.log(`✅ ${created} sample trips created`);
}
