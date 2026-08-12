import { NotFoundError, ConflictError, BadRequestError } from '@/common/errors';
import { logger } from '@/common/logger';
import * as repository from './bus-driver-assignments.repository';

export function setPrismaClient(client: any) {
  repository.setPrismaClient(client);
}

export async function createAssignment(data: any, actorId?: string) {
  return repository.executeTransaction(async (tx) => {
    // 1. Look up shift
    const shift = await repository.findShiftById(tx, data.shiftId);
    if (!shift) throw new NotFoundError('Shift not found', 'SHIFT_NOT_FOUND');

    // 2. Check bus exists and is operational
    const bus = await repository.findBusById(tx, data.busId);
    if (!bus) throw new NotFoundError('Bus not found', 'BUS_NOT_FOUND');
    if (bus.maintenanceStatus !== 'operational') {
      throw new BadRequestError('Bus is not operational', 'BUS_NOT_OPERATIONAL');
    }

    // 3. Check driver license expiry
    if (shift.driver.licenseExpiry && new Date(shift.driver.licenseExpiry) < new Date()) {
      throw new BadRequestError('Driver license has expired', 'LICENSE_EXPIRED');
    }

    // 4. Check bus not already assigned this date
    const busAssigned = await repository.findBusAssignmentByDate(tx, data.busId, data.assignedDate);
    if (busAssigned) throw new ConflictError('Bus already assigned on this date', 'BUS_ALREADY_ASSIGNED');

    // 5. Check shift not already assigned this date
    const shiftAssigned = await repository.findShiftAssignmentByDate(tx, data.shiftId, data.assignedDate);
    if (shiftAssigned) throw new ConflictError('Shift already assigned to a bus on this date', 'SHIFT_ALREADY_ASSIGNED');

    const assignment = await repository.createAssignment(tx, {
      busId: data.busId,
      shiftId: data.shiftId,
      assignedDate: data.assignedDate,
      status: data.status,
    });
    logger.info('Bus-driver assignment created', { assignmentId: assignment.id });
    return assignment;
  });
}

export async function listAssignments(filters: { date?: Date; busId?: string; shiftId?: string } = {}) {
  const where: any = { deletedAt: null };
  if (filters.date) where.assignedDate = filters.date;
  if (filters.busId) where.busId = filters.busId;
  if (filters.shiftId) where.shiftId = filters.shiftId;
  return repository.findAssignments(where);
}

export async function getAssignmentById(id: string) {
  const assignment = await repository.findAssignmentById(id);
  if (!assignment) throw new NotFoundError('Assignment not found', 'ASSIGNMENT_NOT_FOUND');
  return assignment;
}

export async function updateAssignment(id: string, data: any) {
  await getAssignmentById(id);
  const assignment = await repository.updateAssignment(id, { status: data.status });
  logger.info('Assignment updated', { assignmentId: id });
  return assignment;
}

export async function deleteAssignment(id: string, _actorId?: string) {
  await getAssignmentById(id);
  const assignment = await repository.softDeleteAssignment(id);
  logger.info('Assignment soft-deleted', { assignmentId: id });
  return assignment;
}
