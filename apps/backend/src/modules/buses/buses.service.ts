import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '@/prisma/client';
import { NotFoundError, ConflictError } from '@/common/errors';
import { logger } from '@/common/logger';

// Allow prisma client to be injected for testing
let prisma: PrismaClient = defaultPrisma;

export function setPrismaClient(client: PrismaClient) {
  prisma = client;
}

export async function createBus(data: any, actorId?: string) {
  try {
    const bus = await prisma.bus.create({ data });
    logger.info('Bus created', { busId: bus.id });
    return bus;
  } catch (e: any) {
    if (e.code === 'P2002') throw new ConflictError('Plate number already exists', 'PLATE_NUMBER_EXISTS');
    throw e;
  }
}

export async function listBuses(filters: { terminalId?: string; status?: string; search?: string } = {}) {
  const where: any = { deletedAt: null };
  if (filters.terminalId) where.terminalId = filters.terminalId;
  if (filters.status) where.maintenanceStatus = filters.status;
  if (filters.search) {
    where.OR = [
      { plateNumber: { contains: filters.search, mode: 'insensitive' } },
      { model: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return prisma.bus.findMany({ where, orderBy: { plateNumber: 'asc' } });
}

export async function getBusById(id: string) {
  const bus = await prisma.bus.findFirst({ where: { id, deletedAt: null } });
  if (!bus) throw new NotFoundError('Bus not found', 'BUS_NOT_FOUND');
  return bus;
}

export async function updateBus(id: string, data: any) {
  await getBusById(id);
  try {
    const bus = await prisma.bus.update({ where: { id }, data });
    logger.info('Bus updated', { busId: id });
    return bus;
  } catch (e: any) {
    if (e.code === 'P2002') throw new ConflictError('Plate number already exists', 'PLATE_NUMBER_EXISTS');
    throw e;
  }
}

export async function updateMaintenanceStatus(id: string, status: string) {
  await getBusById(id);
  const bus = await prisma.bus.update({ where: { id }, data: { maintenanceStatus: status as any } });
  logger.info('Bus maintenance status updated', { busId: id, status });
  return bus;
}

export async function deleteBus(id: string, _actorId?: string) {
  await getBusById(id);
  const bus = await prisma.bus.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  logger.info('Bus soft-deleted', { busId: id });
  return bus;
}
