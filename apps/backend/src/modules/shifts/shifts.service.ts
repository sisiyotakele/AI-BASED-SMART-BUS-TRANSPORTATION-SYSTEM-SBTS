import { NotFoundError, ConflictError, BadRequestError } from '@/common/errors';
import { logger } from '@/common/logger';
import * as repository from './shifts.repository';

export function setPrismaClient(client: any) {
  repository.setPrismaClient(client);
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

  const overlapping = await repository.findOverlappingShift(
    data.driverId,
    data.shiftDate,
    start,
    end
  );
  if (overlapping) throw new ConflictError('Driver already has an overlapping shift on this date', 'SHIFT_OVERLAP');

  const shift = await repository.createShift({
    driverId: data.driverId,
    shiftName: data.shiftName,
    shiftStart: start,
    shiftEnd: end,
    shiftDate: data.shiftDate,
    isActive: data.isActive,
  });
  logger.info('Shift created', { shiftId: shift.id });
  return shift;
}

export async function listShifts(filters: { driverId?: string; date?: Date } = {}) {
  const where: any = { deletedAt: null };
  if (filters.driverId) where.driverId = filters.driverId;
  if (filters.date) where.shiftDate = filters.date;
  return repository.findShifts(where);
}

export async function getShiftById(id: string) {
  const shift = await repository.findShiftById(id);
  if (!shift) throw new NotFoundError('Shift not found', 'SHIFT_NOT_FOUND');
  return shift;
}

export async function updateShift(id: string, data: any) {
  const existing = await getShiftById(id);
  const start = data.shiftStart ? timeToDate(data.shiftStart, data.shiftDate || existing.shiftDate) : existing.shiftStart;
  const end = data.shiftEnd ? timeToDate(data.shiftEnd, data.shiftDate || existing.shiftDate) : existing.shiftEnd;
  if (end <= start) throw new BadRequestError('Shift end must be after shift start');

  const shift = await repository.updateShift(id, {
    ...(data.driverId && { driverId: data.driverId }),
    ...(data.shiftName && { shiftName: data.shiftName }),
    ...(data.shiftStart && { shiftStart: start }),
    ...(data.shiftEnd && { shiftEnd: end }),
    ...(data.shiftDate && { shiftDate: data.shiftDate }),
    ...(data.isActive !== undefined && { isActive: data.isActive }),
  });
  logger.info('Shift updated', { shiftId: id });
  return shift;
}

export async function deleteShift(id: string, _actorId?: string) {
  await getShiftById(id);
  const shift = await repository.softDeleteShift(id);
  logger.info('Shift soft-deleted', { shiftId: id });
  return shift;
}
