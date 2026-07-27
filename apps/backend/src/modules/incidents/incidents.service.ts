import { NotFoundError, BadRequestError } from '@/common/errors';
import { logger } from '@/common/logger';
import * as repository from './incidents.repository';

// Allow test injection
export function setPrismaClient(client: any) {
  repository.setPrismaClient(client);
}

const VALID_INCIDENT_TRANSITIONS: Record<string, string[]> = {
  reported: ['investigating'],
  investigating: ['resolved', 'closed'],
  resolved: ['closed'],
};

export async function createIncident(data: any, actorId?: string) {
  const trip = await repository.findTripById(data.tripId);
  if (!trip) throw new NotFoundError('Trip not found', 'TRIP_NOT_FOUND');

  const incident = await repository.createIncident({
    tripId: data.tripId,
    busId: trip.busId,
    driverId: trip.driverId,
    incidentType: data.incidentType,
    severity: data.severity,
    description: data.description,
    latitude: data.latitude,
    longitude: data.longitude,
    photoUrl: data.photoUrl,
    status: 'reported',
  });

  // TODO: publish event for notifications module
  logger.info('Incident reported', { incidentId: incident.id, tripId: data.tripId });
  return incident;
}

export async function listIncidents(filters: { status?: string; tripId?: string; driverId?: string } = {}) {
  const where: any = { deletedAt: null };
  if (filters.status) where.status = filters.status;
  if (filters.tripId) where.tripId = filters.tripId;
  if (filters.driverId) where.driverId = filters.driverId;
  return repository.findIncidents(where);
}

export async function getIncidentById(id: string) {
  const incident = await repository.findIncidentById(id);
  if (!incident) throw new NotFoundError('Incident not found', 'INCIDENT_NOT_FOUND');
  return incident;
}

export async function reviewIncident(id: string) {
  const incident = await getIncidentById(id);
  if (!VALID_INCIDENT_TRANSITIONS[incident.status]?.includes('investigating')) {
    throw new BadRequestError(`Cannot review incident in status ${incident.status}`, 'INVALID_TRANSITION');
  }
  const updated = await repository.updateIncident(id, { status: 'investigating' });
  logger.info('Incident under investigation', { incidentId: id });
  return updated;
}

export async function resolveIncident(id: string, data: { resolutionNotes: string }, actorId?: string) {
  const incident = await getIncidentById(id);
  if (!VALID_INCIDENT_TRANSITIONS[incident.status]?.includes('resolved')) {
    throw new BadRequestError(`Cannot resolve incident in status ${incident.status}`, 'INVALID_TRANSITION');
  }

  // Only set resolvedById if actorId is provided and user exists
  const updateData: any = {
    status: 'resolved',
    resolutionNotes: data.resolutionNotes,
    resolvedAt: new Date(),
  };

  if (actorId) {
    const userExists = await repository.findUserById(actorId);
    if (userExists) {
      updateData.resolvedById = actorId;
    }
  }

  const updated = await repository.updateIncident(id, updateData);
  logger.info('Incident resolved', { incidentId: id });
  return updated;
}

export async function deleteIncident(id: string, _actorId?: string) {
  await getIncidentById(id);
  const incident = await repository.softDeleteIncident(id);
  logger.info('Incident soft-deleted', { incidentId: id });
  return incident;
}
