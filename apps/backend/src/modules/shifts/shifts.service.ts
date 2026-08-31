import { NotFoundError, ConflictError, BadRequestError } from '@/common/errors';
import { logger } from '@/common/logger';
import * as repository from './shifts.repository';

export function setPrismaClient(client: any) {
  repository.setPrismaClient(client);
}

function timeToDate(timeStr: string, baseDate: Date, isEndTime = false, startTimeStr?: string) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);

  // If this is an end time and it's earlier than the start time, it means the shift crosses midnight.
  if (isEndTime && startTimeStr) {
    const [startH] = startTimeStr.split(':').map(Number);
    if (h < startH) {
      d.setDate(d.getDate() + 1);
    }
  }

  return d;
}

export async function createShift(data: any, _actorId?: string) {
  const start = timeToDate(data.shiftStart, data.shiftDate);
  const end = timeToDate(data.shiftEnd, data.shiftDate, true, data.shiftStart);
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

  let start = existing.shiftStart;
  let end = existing.shiftEnd;

  if (data.shiftStart || data.shiftEnd || data.shiftDate) {
    const baseDate = data.shiftDate || existing.shiftDate;
    const startStr = data.shiftStart || existing.shiftStart.toTimeString().substring(0, 5);
    const endStr = data.shiftEnd || existing.shiftEnd.toTimeString().substring(0, 5);

    start = timeToDate(startStr, baseDate);
    end = timeToDate(endStr, baseDate, true, startStr);

    if (end <= start) throw new BadRequestError('Shift end must be after shift start');
  }

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

