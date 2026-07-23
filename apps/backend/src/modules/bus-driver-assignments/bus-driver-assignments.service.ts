import { prisma } from '@/prisma/client';
import { NotFoundError, ConflictError, BadRequestError } from '@/common/errors';
import { logger } from '@/common/logger';

let db = prisma;

export function setPrismaClient(client: typeof prisma) {
  db = client;
}

export async function createAssignment(data: any, actorId?: string) {
  return db.$transaction(async (tx) => {
    // 1. Look up shift
    const shift = await tx.shift.findFirst({
      where: { id: data.shiftId, deletedAt: null },
      include: { driver: true },
    });
    if (!shift) throw new NotFoundError('Shift not found', 'SHIFT_NOT_FOUND');

    // 2. Check bus exists and is operational
    const bus = await tx.bus.findFirst({ where: { id: data.busId, deletedAt: null } });
    if (!bus) throw new NotFoundError('Bus not found', 'BUS_NOT_FOUND');
    if (bus.maintenanceStatus !== 'operational') {
      throw new BadRequestError('Bus is not operational', 'BUS_NOT_OPERATIONAL');
    }

    // 3. Check driver license expiry
    if (shift.driver.licenseExpiry && new Date(shift.driver.licenseExpiry) < new Date()) {
      throw new BadRequestError('Driver license has expired', 'LICENSE_EXPIRED');
    }

    // 4. Check bus not already assigned this date
    const busAssigned = await tx.busDriverAssignment.findFirst({
      where: { busId: data.busId, assignedDate: data.assignedDate, deletedAt: null, status: 'active' },
    });
    if (busAssigned) throw new ConflictError('Bus already assigned on this date', 'BUS_ALREADY_ASSIGNED');

    // 5. Check shift not already assigned this date
    const shiftAssigned = await tx.busDriverAssignment.findFirst({
      where: { shiftId: data.shiftId, assignedDate: data.assignedDate, deletedAt: null, status: 'active' },
    });
    if (shiftAssigned) throw new ConflictError('Shift already assigned to a bus on this date', 'SHIFT_ALREADY_ASSIGNED');

    const assignment = await tx.busDriverAssignment.create({
      data: {
        busId: data.busId,
        shiftId: data.shiftId,
        assignedDate: data.assignedDate,
        status: data.status,
      },
      include: {
        bus: { select: { id: true, plateNumber: true } },
        shift: { include: { driver: { select: { id: true, fullName: true } } } },
      },
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
  return db.busDriverAssignment.findMany({
    where,
    include: {
      bus: { select: { id: true, plateNumber: true } },
      shift: { include: { driver: { select: { id: true, fullName: true } } } },
    },
    orderBy: { assignedDate: 'desc' },
  });
}

export async function getAssignmentById(id: string) {
  const assignment = await db.busDriverAssignment.findFirst({
    where: { id, deletedAt: null },
    include: {
      bus: { select: { id: true, plateNumber: true } },
      shift: { include: { driver: { select: { id: true, fullName: true } } } },
    },
  });
  if (!assignment) throw new NotFoundError('Assignment not found', 'ASSIGNMENT_NOT_FOUND');
  return assignment;
}

export async function updateAssignment(id: string, data: any) {
  await getAssignmentById(id);
  const assignment = await db.busDriverAssignment.update({
    where: { id },
    data: { status: data.status },
  });
  logger.info('Assignment updated', { assignmentId: id });
  return assignment;
}

export async function deleteAssignment(id: string, _actorId?: string) {
  await getAssignmentById(id);
  const assignment = await db.busDriverAssignment.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  logger.info('Assignment soft-deleted', { assignmentId: id });
  return assignment;
}
