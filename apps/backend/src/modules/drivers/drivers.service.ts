import bcrypt from 'bcryptjs';
import { config } from '@/config';
import { NotFoundError, ConflictError, AppError } from '@/common/errors';
import { logger } from '@/common/logger';
import * as repository from './drivers.repository';

export function setPrismaClient(client: any) {
  repository.setPrismaClient(client);
}

export async function createDriver(data: any, actorId?: string) {
  const driverRole = await repository.findRoleByName('DRIVER');
  if (!driverRole) throw new AppError('Driver role not found. Run seed first.', 500, 'SEED_MISSING');

  const passwordHash = await bcrypt.hash(data.password, config.bcrypt.rounds);

  try {
    const user = await repository.createDriver({
      fullName: data.fullName,
      email: data.email.toLowerCase().trim(),
      phone: data.phone.trim(),
      passwordHash,
      homeTerminalId: data.homeTerminalId,
      licenseNumber: data.licenseNumber,
      licenseExpiry: data.licenseExpiry,
      preferredLanguage: data.preferredLanguage,
      department: data.department,
      ...(actorId && { createdById: actorId }),
      userRoles: { create: { roleId: driverRole.id, ...(actorId && { createdById: actorId }) } },
    });
    logger.info('Driver created', { userId: user.id });
    return user;
  } catch (e: any) {
    if (e.code === 'P2002') {
      const target = e.meta?.target?.[0] || 'field';
      throw new ConflictError(`Driver with this ${target} already exists`, 'DRIVER_EXISTS', { field: target });
    }
    throw e;
  }
}

export async function listDrivers(filters: { terminalId?: string; search?: string; isActive?: boolean } = {}) {
  const where: any = { deletedAt: null, licenseNumber: { not: null } };
  if (filters.terminalId) where.homeTerminalId = filters.terminalId;
  if (filters.isActive !== undefined) where.isActive = filters.isActive;
  if (filters.search) {
    where.OR = [
      { fullName: { contains: filters.search, mode: 'insensitive' } },
      { email: { contains: filters.search, mode: 'insensitive' } },
      { licenseNumber: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  return repository.findDrivers(where);
}

export async function getDriverById(id: string) {
  const driver = await repository.findDriverById(id);
  if (!driver) throw new NotFoundError('Driver not found', 'DRIVER_NOT_FOUND');
  return driver;
}

export async function updateDriver(id: string, data: any) {
  await getDriverById(id);
  try {
    const driver = await repository.updateDriver(id, data);
    logger.info('Driver updated', { userId: id });
    return driver;
  } catch (e: any) {
    if (e.code === 'P2002') {
      const target = e.meta?.target?.[0] || 'field';
      throw new ConflictError(`Driver with this ${target} already exists`, 'DRIVER_EXISTS', { field: target });
    }
    throw e;
  }
}

export async function deleteDriver(id: string, actorId?: string) {
  await getDriverById(id);
  const driver = await repository.softDeleteDriver(id, actorId);
  logger.info('Driver soft-deleted', { userId: id });
  return driver;
}
