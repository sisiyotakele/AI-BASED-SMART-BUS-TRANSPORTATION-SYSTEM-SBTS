import { prismaTest } from './test-db';

// Inject test database client into all services
beforeAll(() => {
  // Import and inject into auth service
  const authService = require('@/modules/auth/auth.service');
  if (authService.setPrismaClient) {
    authService.setPrismaClient(prismaTest);
  }
});

afterAll(async () => {
  await prismaTest.$disconnect();
  console.log('🔌 Test database disconnected');
});
