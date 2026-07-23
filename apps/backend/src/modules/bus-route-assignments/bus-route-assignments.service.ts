import { prisma } from '@/prisma/client';
import { NotFoundError } from '@/common/errors';
import { logger } from '@/common/logger';

let db = prisma;

export function setPrismaClient(client: typeof prisma) {
  db = client;
}

export async function createAssignment(data: any, _actorId?: string) {
  const assignment = await db.busRouteAssignment.create({
    data: {
      busId: data.busId,
      routeId: data.routeId,
      assignedDate: data.assignedDate,
      endDate: data.endDate,
      isActive: true,
    },
    include: {
      bus: { select: { id: true, plateNumber: true } },
      route: { select: { id: true, routeName: true } },
    },
  });
  logger.info('Bus-route assignment created', { assignmentId: assignment.id });
  return assignment;
}

export async function listAssignments(filters: { busId?: string } = {}) {
  const where: any = { deletedAt: null };
  if (filters.busId) where.busId = filters.busId;
  return db.busRouteAssignment.findMany({
    where,
    include: {
      bus: { select: { id: true, plateNumber: true } },
      route: { select: { id: true, routeName: true } },
    },
    orderBy: { assignedDate: 'desc' },
  });
}

export async function getAssignmentById(id: string) {
  const assignment = await db.busRouteAssignment.findFirst({
    where: { id, deletedAt: null },
    include: {
      bus: { select: { id: true, plateNumber: true } },
      route: { select: { id: true, routeName: true } },
    },
  });
  if (!assignment) throw new NotFoundError('Assignment not found', 'ASSIGNMENT_NOT_FOUND');
  return assignment;
}

export async function deactivateAssignment(id: string, data?: { endDate?: Date }) {
  await getAssignmentById(id);
  const assignment = await db.busRouteAssignment.update({
    where: { id },
    data: {
      isActive: false,
      endDate: data?.endDate || new Date(),
    },
  });
  logger.info('Bus-route assignment deactivated', { assignmentId: id });
  return assignment;
}

export async function deleteAssignment(id: string, _actorId?: string) {
  await getAssignmentById(id);
  const assignment = await db.busRouteAssignment.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  logger.info('Bus-route assignment soft-deleted', { assignmentId: id });
  return assignment;
}
