import { PrismaClient } from '@prisma/client';

const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL;

if (!TEST_DATABASE_URL) {
  throw new Error(
    'TEST_DATABASE_URL must be set for integration tests.\n' +
    'Example: TEST_DATABASE_URL="postgresql://sbts_user:sbts_password@localhost:5432/sbts_test_db?schema=public"'
  );
}

export const prismaTest = new PrismaClient({
  datasources: {
    db: {
      url: TEST_DATABASE_URL,
    },
  },
  log: process.env.DEBUG_TESTS === 'true' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

export async function resetDatabase() {
  const tables = [
    'audit_logs',
    'login_history',
    'notification_users',
    'notifications',
    'traffic_predictions',
    'ai_models',
    'incidents',
    'bus_live_locations',
    'trip_gps_logs',
    'trips',
    'key_handovers',
    'bus_route_assignments',
    'bus_driver_assignments',
    'schedules',
    'prices',
    'route_stops',
    'route_versions',
    'stops',
    'routes',
    'shifts',
    'buses',
    'terminals',
    'user_roles',
    'role_permissions',
    'users',
    'roles',
    'permissions',
  ];

  for (const table of tables) {
    try {
      await prismaTest.$executeRawUnsafe(`DELETE FROM "${table}"`);
    } catch {
      // Table might not exist yet, ignore
    }
  }
}
