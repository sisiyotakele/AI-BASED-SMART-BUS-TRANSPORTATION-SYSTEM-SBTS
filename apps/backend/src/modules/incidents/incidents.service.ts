import { prisma } from '@/prisma/client';
import { NotFoundError, BadRequestError } from '@/common/errors';
import { logger } from '@/common/logger';

// Allow test injection
let db = prisma;
export function setPrismaClient(client: typeof prisma) {
  db = client;
}

const VALID_INCIDENT_TRANSITIONS: Record<string, string[]> = {
  reported: ['investigating'],
  investigating: ['resolved', 'closed'],
  resolved: ['closed'],
};

export async function createIncident(data: any, actorId?: string) {
  const trip = await db.trip.findFirst({
    where: { id: data.tripId, deletedAt: null },
    include: { bus: true, driver: true },
  });
  if (!trip) throw new NotFoundError('Trip not found', 'TRIP_NOT_FOUND');

  const incident = await db.incident.create({
    data: {
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
    },
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
  return db.incident.findMany({
    where,
    include: {
      trip: { select: { id: true, scheduledStart: true } },
      bus: { select: { id: true, plateNumber: true } },
      driver: { select: { id: true, fullName: true } },
      resolvedBy: { select: { id: true, fullName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getIncidentById(id: string) {
  const incident = await db.incident.findFirst({
    where: { id, deletedAt: null },
    include: {
      trip: { select: { id: true, scheduledStart: true } },
      bus: { select: { id: true, plateNumber: true } },
      driver: { select: { id: true, fullName: true } },
      resolvedBy: { select: { id: true, fullName: true } },
    },
  });
  if (!incident) throw new NotFoundError('Incident not found', 'INCIDENT_NOT_FOUND');
  return incident;
}

export async function reviewIncident(id: string) {
  const incident = await getIncidentById(id);
  if (!VALID_INCIDENT_TRANSITIONS[incident.status]?.includes('investigating')) {
    throw new BadRequestError(`Cannot review incident in status ${incident.status}`, 'INVALID_TRANSITION');
  }
  const updated = await db.incident.update({
    where: { id },
    data: { status: 'investigating' },
  });
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
    const userExists = await db.user.findUnique({ where: { id: actorId } });
    if (userExists) {
      updateData.resolvedById = actorId;
    }
  }

  const updated = await db.incident.update({
    where: { id },
    data: updateData,
  });
  logger.info('Incident resolved', { incidentId: id });
  return updated;
}

export async function deleteIncident(id: string, _actorId?: string) {
  await getIncidentById(id);
  const incident = await db.incident.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  logger.info('Incident soft-deleted', { incidentId: id });
  return incident;
}
