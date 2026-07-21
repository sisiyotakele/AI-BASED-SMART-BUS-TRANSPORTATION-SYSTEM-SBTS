import bcrypt from 'bcryptjs';
import { prisma as defaultPrisma } from '@/prisma/client';
import { config } from '@/config';
import { NotFoundError, ConflictError, AppError } from '@/common/errors';
import { logger } from '@/common/logger';

let prisma = defaultPrisma;

export function setPrismaClient(client: any) {
  prisma = client;
}

export async function createDriver(data: any, actorId?: string) {
  const driverRole = await prisma.role.findFirst({ where: { roleName: 'DRIVER', deletedAt: null } });
  if (!driverRole) throw new AppError('Driver role not found. Run seed first.', 500, 'SEED_MISSING');

  const passwordHash = await bcrypt.hash(data.password, config.bcrypt.rounds);

  try {
    const user = await prisma.user.create({
      data: {
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
      },
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
  return prisma.user.findMany({ where, orderBy: { fullName: 'asc' } });
}

export async function getDriverById(id: string) {
  const driver = await prisma.user.findFirst({ where: { id, deletedAt: null, licenseNumber: { not: null } } });
  if (!driver) throw new NotFoundError('Driver not found', 'DRIVER_NOT_FOUND');
  return driver;
}

export async function updateDriver(id: string, data: any) {
  await getDriverById(id);
  try {
    const driver = await prisma.user.update({ where: { id }, data });
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
  const driver = await prisma.user.update({
    where: { id },
    data: { deletedAt: new Date(), ...(actorId && { deletedById: actorId }) },
  });
  logger.info('Driver soft-deleted', { userId: id });
  return driver;
}
