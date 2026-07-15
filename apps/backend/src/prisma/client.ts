import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient | null = null;

try {
  prisma = new PrismaClient();
} catch (error) {
  // If Prisma client isn't generated yet, leave prisma as null and
  // higher-level code should handle fallback behavior.
  // eslint-disable-next-line no-console
  console.warn('Prisma client not available; falling back to demo behavior.');
}

export { prisma };