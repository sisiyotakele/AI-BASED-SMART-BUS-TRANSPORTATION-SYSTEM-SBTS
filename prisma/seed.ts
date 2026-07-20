// ================================================================
// MAIN SEED ORCHESTRATOR
// ================================================================
// Runs seed modules in dependency order.
//
// SEED PHASES:
//   SYSTEM: Roles, Permissions, RolePermissions (never change)
//   INFRASTRUCTURE: Users, Terminals, Stops, Routes, etc. (initial data)
//   SAMPLE: Optional sample incidents/trips (for testing UI)
//
// GENERATED AT RUNTIME (NOT SEEDED):
//   Shift, BusDriverAssignment, Trip, TripGPSLog,
//   BusLiveLocation, KeyHandover, Notification,
//   LoginHistory, AuditLog, AIModel, TrafficPrediction
// ================================================================

import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

function assertRequiredEnv() {
  const required = ['ADMIN_PASSWORD', 'SEED_DEFAULT_PASSWORD'];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(', ')}. ` +
      `Copy prisma/.env.example to prisma/.env and set them before seeding.`
    );
  }
}

async function clearData() {
  console.log('🧹 Clearing existing data...');
  await prisma.$transaction([
    prisma.busLiveLocation.deleteMany(),
    prisma.notificationUser.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.tripGPSLog.deleteMany(),
    prisma.incident.deleteMany(),
    prisma.trip.deleteMany(),
    prisma.keyHandover.deleteMany(),
    prisma.busDriverAssignment.deleteMany(),
    prisma.shift.deleteMany(),
    prisma.busRouteAssignment.deleteMany(),
    prisma.bus.deleteMany(),
    prisma.pricing.deleteMany(),
    prisma.schedule.deleteMany(),
    prisma.routeStop.deleteMany(),
    prisma.routeVersion.deleteMany(),
    prisma.route.deleteMany(),
    prisma.stop.deleteMany(),
    prisma.terminal.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.loginHistory.deleteMany(),
    prisma.userRole.deleteMany(),
    prisma.rolePermission.deleteMany(),
    prisma.role.deleteMany(),
    prisma.permission.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  console.log('✅ Existing data cleared');
}

async function main() {
  assertRequiredEnv();

  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║     SHEGER BUS FLEET MANAGEMENT SYSTEM                 ║');
  console.log('║     DATABASE SEED                                      ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  await clearData();

  // PHASE 1: SYSTEM DATA (Never changes)
  console.log('\n📦 PHASE 1: SYSTEM DATA');
  console.log('─────────────────────────\n');
  const { seedRoles } = await import('./seeds/system/01-roles.seed');
  const { seedPermissions } = await import('./seeds/system/02-permissions.seed');
  const { seedRolePermissions } = await import('./seeds/system/03-role-permissions.seed');
  await seedRoles(prisma);
  await seedPermissions(prisma);
  await seedRolePermissions(prisma);

  // PHASE 2: INFRASTRUCTURE DATA (Initial state)
  console.log('\n🏗️ PHASE 2: INFRASTRUCTURE DATA');
  console.log('───────────────────────────────\n');
  const { seedUsers } = await import('./seeds/infrastructure/04-users.seed');
  const { seedTerminals } = await import('./seeds/infrastructure/05-terminals.seed');
  const { seedStops } = await import('./seeds/infrastructure/06-stops.seed');
  const { seedRoutes } = await import('./seeds/infrastructure/07-routes.seed');
  const { seedRouteVersions } = await import('./seeds/infrastructure/08-route-versions.seed');
  const { seedRouteStops } = await import('./seeds/infrastructure/09-route-stops.seed');
  const { seedPricing } = await import('./seeds/infrastructure/10-pricing.seed');
  const { seedSchedules } = await import('./seeds/infrastructure/11-schedules.seed');
  const { seedBuses } = await import('./seeds/infrastructure/12-buses.seed');

  await seedUsers(prisma);
  await seedTerminals(prisma);
  await seedStops(prisma);
  await seedRoutes(prisma);
  await seedRouteVersions(prisma);
  await seedRouteStops(prisma);
  await seedPricing(prisma);
  await seedSchedules(prisma);
  await seedBuses(prisma);

  // PHASE 3: SAMPLE DATA (Optional - for demo only)
  if (process.env.SEED_SAMPLE_DATA !== 'false') {
    console.log('\n📋 PHASE 3: SAMPLE DATA (optional)');
    console.log('─────────────────────────────────\n');
    const { seedSampleIncidents } = await import('./seeds/sample/13-sample-incidents.seed');
    const { seedSampleTrips } = await import('./seeds/sample/14-sample-trips.seed');
    await seedSampleIncidents(prisma);
    await seedSampleTrips(prisma);
  }

  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║     ✅ SEEDING COMPLETED SUCCESSFULLY!                 ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');
  console.log('🔑 ADMIN LOGIN:');
  console.log(`   📧 Email: ${process.env.ADMIN_EMAIL || 'admin@shegerbus.et'}`);
  console.log('   🔑 Password: set in .env (never printed here)\n');
  console.log('📊 SEED SUMMARY:');
  console.log('   ✅ System: Roles, Permissions, RolePermissions');
  console.log('   ✅ Infrastructure: Users, Terminals, Stops, Routes, Pricing, Schedules, Buses');
  console.log('   ✅ Sample: Incidents, Trips (optional)\n');
  console.log('🚀 Ready for development!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });