import { NotFoundError } from '@/common/errors';
import { logger } from '@/common/logger';
import * as repository from './schedules.repository';

export function setPrismaClient(client: any) {
  repository.setPrismaClient(client);
}

function timeToDate(timeStr: string) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d;
}

export async function createSchedule(data: any, _actorId?: string) {
  const schedule = await repository.createSchedule({
    routeId: data.routeId,
    versionId: data.versionId,
    scheduleName: data.scheduleName,
    dayOfWeek: data.dayOfWeek,
    departureTime: timeToDate(data.departureTime),
    frequencyMinutes: data.frequencyMinutes,
    isActive: data.isActive,
    effectiveFrom: data.effectiveFrom,
    effectiveUntil: data.effectiveUntil,
  });
  logger.info('Schedule created', { scheduleId: schedule.id });
  return schedule;
}

export async function listSchedules(filters: { routeId?: string; dayOfWeek?: string } = {}) {
  const where: any = { deletedAt: null };
  if (filters.routeId) where.routeId = filters.routeId;
  if (filters.dayOfWeek) where.dayOfWeek = filters.dayOfWeek;
  return repository.findSchedules(where);
}

export async function getScheduleById(id: string) {
  const schedule = await repository.findScheduleById(id);
  if (!schedule) throw new NotFoundError('Schedule not found', 'SCHEDULE_NOT_FOUND');
  return schedule;
}

export async function updateSchedule(id: string, data: any) {
  await getScheduleById(id);
  const updateData: any = {};
  if (data.scheduleName) updateData.scheduleName = data.scheduleName;
  if (data.dayOfWeek) updateData.dayOfWeek = data.dayOfWeek;
  if (data.departureTime) updateData.departureTime = timeToDate(data.departureTime);
  if (data.frequencyMinutes !== undefined) updateData.frequencyMinutes = data.frequencyMinutes;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;
  if (data.effectiveUntil) updateData.effectiveUntil = data.effectiveUntil;

  const schedule = await repository.updateSchedule(id, updateData);
  logger.info('Schedule updated', { scheduleId: id });
  return schedule;
}

export async function deleteSchedule(id: string, _actorId?: string) {
  await getScheduleById(id);
  const schedule = await repository.softDeleteSchedule(id);
  logger.info('Schedule soft-deleted', { scheduleId: id });
  return schedule;
}
