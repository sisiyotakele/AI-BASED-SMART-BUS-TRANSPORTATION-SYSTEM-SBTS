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
    const busAssigned = await repository.findOverlappingBusAssignments(tx, data.busId, data.assignedDate, shift.shiftStart, shift.shiftEnd);
    if (busAssigned) throw new ConflictError('Bus is already assigned to an overlapping shift on this date', 'BUS_ALREADY_ASSIGNED');

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

function timeToDate(timeStr: string, baseDate: Date, isEndTime = false, startTimeStr?: string) {
  const [h, m] = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(h, m, 0, 0);

  if (isEndTime && startTimeStr) {
    const [startH] = startTimeStr.split(':').map(Number);
    if (h < startH) {
      d.setDate(d.getDate() + 1);
    }
  }
  return d;
}

export async function createAssignmentWithShift(data: {
  driverId: string;
  busId: string;
  assignedDate: Date;
  shiftStart: string;
  shiftEnd: string;
  shiftName?: string;
}, _actorId?: string) {
  return repository.executeTransaction(async (tx) => {
    // 1. Validate driver exists
    const driver = await tx.user.findFirst({
      where: { id: data.driverId, deletedAt: null },
    });
    if (!driver) throw new NotFoundError('Driver not found', 'DRIVER_NOT_FOUND');

    // Check driver license expiry
    if (driver.licenseExpiry && new Date(driver.licenseExpiry) < new Date()) {
      throw new BadRequestError('Driver license has expired', 'LICENSE_EXPIRED');
    }

    // 2. Validate Bus exists & operational
    const bus = await repository.findBusById(tx, data.busId);
    if (!bus) throw new NotFoundError('Bus not found', 'BUS_NOT_FOUND');
    if (bus.maintenanceStatus !== 'operational') {
      throw new BadRequestError('Bus is not operational', 'BUS_NOT_OPERATIONAL');
    }

    const baseDate = new Date(data.assignedDate);
    const start = timeToDate(data.shiftStart, baseDate);
    const end = timeToDate(data.shiftEnd, baseDate, true, data.shiftStart);

    if (end <= start) throw new BadRequestError('Shift end must be after shift start');

    // 3. Check driver overlapping shift
    const overlappingShift = await tx.shift.findFirst({
      where: {
        driverId: data.driverId,
        shiftDate: data.assignedDate,
        deletedAt: null,
        AND: [
          { shiftEnd: { gt: start } },
          { shiftStart: { lt: end } }
        ]
      }
    });
    if (overlappingShift) {
      throw new ConflictError('Driver already has an overlapping shift on this date', 'SHIFT_OVERLAP');
    }

    // 4. Check bus availability
    const busAssigned = await repository.findOverlappingBusAssignments(tx, data.busId, data.assignedDate, start, end);
    if (busAssigned) {
      throw new ConflictError('Bus is already assigned to an overlapping shift on this date', 'BUS_ALREADY_ASSIGNED');
    }

    // 5. Create Shift in transaction
    const shiftName = data.shiftName || `Shift ${data.shiftStart} - ${data.shiftEnd}`;
    const createdShift = await tx.shift.create({
      data: {
        driverId: data.driverId,
        shiftName,
        shiftStart: start,
        shiftEnd: end,
        shiftDate: data.assignedDate,
        isActive: true,
      }
    });

    // 6. Create Driver-Bus Assignment in transaction
    const assignment = await tx.busDriverAssignment.create({
      data: {
        busId: data.busId,
        shiftId: createdShift.id,
        assignedDate: data.assignedDate,
        status: 'active',
      },
      include: {
        bus: { select: { id: true, plateNumber: true, model: true } },
        shift: { include: { driver: { select: { id: true, fullName: true } } } },
      }
    });

    logger.info('Bus-driver assignment and shift created in 1 transaction', {
      assignmentId: assignment.id,
      shiftId: createdShift.id,
      driverId: data.driverId
    });

    return assignment;
  });
}

export async function listAssignments(filters: { date?: Date; busId?: string; shiftId?: string; driverId?: string } = {}) {
  const where: any = { deletedAt: null };
  if (filters.date) where.assignedDate = filters.date;
  if (filters.busId) where.busId = filters.busId;
  if (filters.shiftId) where.shiftId = filters.shiftId;
  if (filters.driverId) {
    where.shift = {
       driverId: filters.driverId
    };
  }
  return repository.findAssignments(where);
}

export async function getAssignmentById(id: string) {
  const assignment = await repository.findAssignmentById(id);
  if (!assignment) throw new NotFoundError('Assignment not found', 'ASSIGNMENT_NOT_FOUND');
  return assignment;
}

export async function updateAssignment(id: string, data: any) {
  await getAssignmentById(id);
  const assignment = await repository.updateAssignment(id, data);
  logger.info('Assignment updated', { assignmentId: id });
  return assignment;
}

export async function deleteAssignment(id: string, _actorId?: string) {
  await getAssignmentById(id);
  const assignment = await repository.softDeleteAssignment(id);
  logger.info('Assignment soft-deleted', { assignmentId: id });
  return assignment;
}
