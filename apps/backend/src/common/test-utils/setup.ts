import { resetDatabase } from './test-db';

beforeEach(async () => {
  await resetDatabase();
});

afterAll(async () => {
  const { prismaTest } = require('./test-db');
  await prismaTest.$disconnect();
});
