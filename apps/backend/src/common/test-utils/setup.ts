import { prismaTest } from './test-db';

// Inject test database client into all services
beforeAll(() => {
  // Import and inject into auth service
  const authService = require('@/modules/auth/auth.service');
  if (authService.setPrismaClient) {
    authService.setPrismaClient(prismaTest);
  }

  // Import and inject into rbac service
  const rbacService = require('@/modules/rbac/rbac.service');
  if (rbacService.setPrismaClient) {
    rbacService.setPrismaClient(prismaTest);
  }

  // Import and inject into terminals service
  const terminalsService = require('@/modules/terminals/terminals.service');
  if (terminalsService.setPrismaClient) {
    terminalsService.setPrismaClient(prismaTest);
  }

  // Import and inject into buses service
  const busesService = require('@/modules/buses/buses.service');
  if (busesService.setPrismaClient) {
    busesService.setPrismaClient(prismaTest);
  }

  // Import and inject into drivers service
  const driversService = require('@/modules/drivers/drivers.service');
  if (driversService.setPrismaClient) {
    driversService.setPrismaClient(prismaTest);
  }

  // Import and inject into routes-stops service
  const routesStopsService = require('@/modules/routes-stops/routes-stops.service');
  if (routesStopsService.setPrismaClient) {
    routesStopsService.setPrismaClient(prismaTest);
  }

  // Import and inject into schedules service
  const schedulesService = require('@/modules/schedules/schedules.service');
  if (schedulesService.setPrismaClient) {
    schedulesService.setPrismaClient(prismaTest);
  }
});

afterAll(async () => {
  await prismaTest.$disconnect();
  console.log('🔌 Test database disconnected');
});