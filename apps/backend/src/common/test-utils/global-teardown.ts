import { prismaTest } from './test-db';

export default async function globalTeardown() {
  await prismaTest.$disconnect();
  console.log('🔌 Test database disconnected');
}
