import { NotFoundError } from '@/common/errors';
import { logger } from '@/common/logger';
import * as repository from './bus-route-assignments.repository';

export function setPrismaClient(client: any) {
  repository.setPrismaClient(client);
}

export async function createAssignment(data: any, _actorId?: string) {
  const assignment = await repository.createAssignment({
    busId: data.busId,
    routeId: data.routeId,
    assignedDate: data.assignedDate,
    endDate: data.endDate,
    isActive: true,
  });
  logger.info('Bus-route assignment created', { assignmentId: assignment.id });
  return assignment;
}

export async function listAssignments(filters: { busId?: string } = {}) {
  const where: any = { deletedAt: null };
  if (filters.busId) where.busId = filters.busId;
  return repository.findAssignments(where);
}

export async function getAssignmentById(id: string) {
  const assignment = await repository.findAssignmentById(id);
  if (!assignment) throw new NotFoundError('Assignment not found', 'ASSIGNMENT_NOT_FOUND');
  return assignment;
}

export async function deactivateAssignment(id: string, data?: { endDate?: Date }) {
  await getAssignmentById(id);
  const assignment = await repository.updateAssignment(id, {
    isActive: false,
    endDate: data?.endDate || new Date(),
  });
  logger.info('Bus-route assignment deactivated', { assignmentId: id });
  return assignment;
}

export async function deleteAssignment(id: string, _actorId?: string) {
  await getAssignmentById(id);
  const assignment = await repository.softDeleteAssignment(id);
  logger.info('Bus-route assignment soft-deleted', { assignmentId: id });
  return assignment;
}
