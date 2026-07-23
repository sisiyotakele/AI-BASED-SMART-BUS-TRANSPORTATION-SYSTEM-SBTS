import { prisma } from '@/prisma/client';
import { NotFoundError, ConflictError, BadRequestError } from '@/common/errors';
import { logger } from '@/common/logger';

let db = prisma;

export function setPrismaClient(client: typeof prisma) {
  db = client;
}

function timeToDate(timeStr: string, baseDate: Date) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);
  return d;
}

export async function createShift(data: any, _actorId?: string) {
  const start = timeToDate(data.shiftStart, data.shiftDate);
  const end = timeToDate(data.shiftEnd, data.shiftDate);
  if (end <= start) throw new BadRequestError('Shift end must be after shift start');

  const overlapping = await db.shift.findFirst({
    where: {
      driverId: data.driverId,
      shiftDate: data.shiftDate,
      deletedAt: null,
      OR: [
        { shiftStart: { lte: end }, shiftEnd: { gte: start } },
      ],
    },
  });
  if (overlapping) throw new ConflictError('Driver already has an overlapping shift on this date', 'SHIFT_OVERLAP');

  const shift = await db.shift.create({
    data: {
      driverId: data.driverId,
      shiftName: data.shiftName,
      shiftStart: start,
      shiftEnd: end,
      shiftDate: data.shiftDate,
      isActive: data.isActive,
    },
  });
  logger.info('Shift created', { shiftId: shift.id });
  return shift;
}

export async function listShifts(filters: { driverId?: string; date?: Date } = {}) {
  const where: any = { deletedAt: null };
  if (filters.driverId) where.driverId = filters.driverId;
  if (filters.date) where.shiftDate = filters.date;
  return db.shift.findMany({ where, orderBy: { shiftDate: 'desc' }, include: { driver: { select: { id: true, fullName: true } } } });
}

export async function getShiftById(id: string) {
  const shift = await db.shift.findFirst({ where: { id, deletedAt: null }, include: { driver: { select: { id: true, fullName: true } } } });
  if (!shift) throw new NotFoundError('Shift not found', 'SHIFT_NOT_FOUND');
  return shift;
}

export async function updateShift(id: string, data: any) {
  const existing = await getShiftById(id);
  const start = data.shiftStart ? timeToDate(data.shiftStart, data.shiftDate || existing.shiftDate) : existing.shiftStart;
  const end = data.shiftEnd ? timeToDate(data.shiftEnd, data.shiftDate || existing.shiftDate) : existing.shiftEnd;
  if (end <= start) throw new BadRequestError('Shift end must be after shift start');

  const shift = await db.shift.update({
    where: { id },
    data: {
      ...(data.driverId && { driverId: data.driverId }),
      ...(data.shiftName && { shiftName: data.shiftName }),
      ...(data.shiftStart && { shiftStart: start }),
      ...(data.shiftEnd && { shiftEnd: end }),
      ...(data.shiftDate && { shiftDate: data.shiftDate }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
  });
  logger.info('Shift updated', { shiftId: id });
  return shift;
}

export async function deleteShift(id: string, _actorId?: string) {
  await getShiftById(id);
  const shift = await db.shift.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  logger.info('Shift soft-deleted', { shiftId: id });
  return shift;
}
