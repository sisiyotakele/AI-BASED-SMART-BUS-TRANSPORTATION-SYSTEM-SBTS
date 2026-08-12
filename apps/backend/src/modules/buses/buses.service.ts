import { PrismaClient } from '@prisma/client';
import { NotFoundError, ConflictError } from '@/common/errors';
import { logger } from '@/common/logger';
import * as repository from './buses.repository';

// Allow prisma client to be injected for testing
export function setPrismaClient(client: PrismaClient) {
  repository.setPrismaClient(client);
}

export async function createBus(data: any, actorId?: string) {
  try {
    const bus = await repository.createBus(data);
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
  return repository.findBuses(where);
}

export async function getBusById(id: string) {
  const bus = await repository.findBusById(id);
  if (!bus) throw new NotFoundError('Bus not found', 'BUS_NOT_FOUND');
  return bus;
}

export async function updateBus(id: string, data: any) {
  await getBusById(id);
  try {
    const bus = await repository.updateBus(id, data);
    logger.info('Bus updated', { busId: id });
    return bus;
  } catch (e: any) {
    if (e.code === 'P2002') throw new ConflictError('Plate number already exists', 'PLATE_NUMBER_EXISTS');
    throw e;
  }
}

export async function updateMaintenanceStatus(id: string, status: string) {
  await getBusById(id);
  const bus = await repository.updateBus(id, { maintenanceStatus: status as any });
  logger.info('Bus maintenance status updated', { busId: id, status });
  return bus;
}

export async function deleteBus(id: string, _actorId?: string) {
  await getBusById(id);
  const bus = await repository.softDeleteBus(id);
  logger.info('Bus soft-deleted', { busId: id });
  return bus;
}
