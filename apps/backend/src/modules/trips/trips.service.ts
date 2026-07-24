import { prisma } from '@/prisma/client';
import { NotFoundError, ConflictError, BadRequestError } from '@/common/errors';
import { logger } from '@/common/logger';

const VALID_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['active', 'cancelled'],
  active: ['paused', 'completed', 'cancelled'],
  paused: ['active'],
};

function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Create a new trip with proper double-booking prevention
 * 
 * Protection layers:
 * 1. Database exclusion constraints (PRIMARY - prevents at DB level)
 * 2. Serializable transaction (SECONDARY - prevents race conditions)
 * 3. Explicit overlap checks (TERTIARY - provides clear error messages)
 * 
 * @throws ConflictError if bus or driver has overlapping trip
 */
export async function createTrip(data: any, actorId?: string) {
  return prisma.$transaction(
    async (tx) => {
      // LAYER 1: Explicit checks for clear error messages
      // These run first to provide user-friendly error messages
      // If they pass but a race condition occurs, the DB constraint will catch it

      const busOverlap = await tx.trip.findFirst({
        where: {
          busId: data.busId,
          status: { in: ['scheduled', 'in_progress'] },
          deletedAt: null,
          OR: [
            {
              scheduledStart: { lte: data.scheduledEnd },
              scheduledEnd: { gte: data.scheduledStart }
            },
          ],
        },
      });

      if (busOverlap) {
        throw new ConflictError(
          `Bus ${data.busId} already has a trip scheduled from ${busOverlap.scheduledStart.toISOString()} to ${busOverlap.scheduledEnd.toISOString()}`,
          'BUS_DOUBLE_BOOKED'
        );
      }

      const driverOverlap = await tx.trip.findFirst({
        where: {
          driverId: data.driverId,
          status: { in: ['scheduled', 'in_progress'] },
          deletedAt: null,
          OR: [
            {
              scheduledStart: { lte: data.scheduledEnd },
              scheduledEnd: { gte: data.scheduledStart }
            },
          ],
        },
      });

      if (driverOverlap) {
        throw new ConflictError(
          `Driver ${data.driverId} already has a trip scheduled from ${driverOverlap.scheduledStart.toISOString()} to ${driverOverlap.scheduledEnd.toISOString()}`,
          'DRIVER_DOUBLE_BOOKED'
        );
      }

      // LAYER 2 & 3: Insert with database-level protection
      // If a concurrent request passed the checks above, the DB exclusion constraint
      // will reject this insert with a unique violation error
      try {
        const trip = await tx.trip.create({
          data: {
            busId: data.busId,
            driverId: data.driverId,
            versionId: data.versionId,
            scheduleId: data.scheduleId,
            keyHandoverId: data.keyHandoverId,
            scheduledStart: data.scheduledStart,
            scheduledEnd: data.scheduledEnd,
            status: 'scheduled',
          },
          include: {
            bus: { select: { id: true, plateNumber: true } },
            driver: { select: { id: true, fullName: true } },
            version: { select: { id: true, versionNumber: true } },
            schedule: { select: { id: true, scheduleName: true } },
          },
        });

        logger.info('Trip created successfully', {
          tripId: trip.id,
          busId: data.busId,
          driverId: data.driverId
        });

        return trip;
      } catch (error: any) {
        // Handle database exclusion constraint violations
        if (error.code === '23P01') { // PostgreSQL exclusion constraint violation
          if (error.constraint === 'trips_bus_no_overlap_excl') {
            throw new ConflictError(
              'Bus has an overlapping trip (detected by database constraint)',
              'BUS_DOUBLE_BOOKED'
            );
          }
          if (error.constraint === 'trips_driver_no_overlap_excl') {
            throw new ConflictError(
              'Driver has an overlapping trip (detected by database constraint)',
              'DRIVER_DOUBLE_BOOKED'
            );
          }
        }
        throw error; // Re-throw other errors
      }
    },
    {
      isolationLevel: 'Serializable', // LAYER 2: Highest isolation level
      maxWait: 5000, // Wait max 5 seconds for transaction to start
      timeout: 10000, // Transaction timeout after 10 seconds
    }
  );
}

export async function listTrips(filters: { driverId?: string; status?: string; busId?: string; date?: Date } = {}) {
  const where: any = { deletedAt: null };
  if (filters.driverId) where.driverId = filters.driverId;
  if (filters.status) where.status = filters.status;
  if (filters.busId) where.busId = filters.busId;
  if (filters.date) {
    const start = new Date(filters.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filters.date);
    end.setHours(23, 59, 59, 999);
    where.scheduledStart = { gte: start, lte: end };
  }
  return prisma.trip.findMany({
    where,
    include: {
      bus: { select: { id: true, plateNumber: true } },
      driver: { select: { id: true, fullName: true } },
      version: { select: { id: true, versionNumber: true } },
      schedule: { select: { id: true, scheduleName: true } },
    },
    orderBy: { scheduledStart: 'desc' },
  });
}

export async function getTripById(id: string) {
  const trip = await prisma.trip.findFirst({
    where: { id, deletedAt: null },
    include: {
      bus: { select: { id: true, plateNumber: true } },
      driver: { select: { id: true, fullName: true } },
      version: { select: { id: true, versionNumber: true } },
      schedule: { select: { id: true, scheduleName: true } },
    },
  });
  if (!trip) throw new NotFoundError('Trip not found', 'TRIP_NOT_FOUND');
  return trip;
}

async function transitionTrip(id: string, newStatus: string, extraData?: any) {
  const trip = await getTripById(id);
  if (!isValidTransition(trip.status, newStatus)) {
    throw new BadRequestError(
      `Invalid transition from ${trip.status} to ${newStatus}. Allowed: ${VALID_TRANSITIONS[trip.status]?.join(', ') || 'none'}`,
      'INVALID_STATE_TRANSITION'
    );
  }

  const data: any = { status: newStatus, ...extraData };
  const updated = await prisma.trip.update({ where: { id }, data });
  logger.info(`Trip ${newStatus}`, { tripId: id });
  return updated;
}

export async function startTrip(id: string) {
  return transitionTrip(id, 'active', { actualStart: new Date() });
}

export async function pauseTrip(id: string) {
  return transitionTrip(id, 'paused');
}

export async function resumeTrip(id: string) {
  return transitionTrip(id, 'active');
}

export async function endTrip(id: string) {
  return transitionTrip(id, 'completed', { actualEnd: new Date() });
}

export async function cancelTrip(id: string) {
  return transitionTrip(id, 'cancelled');
}

export async function deleteTrip(id: string, _actorId?: string) {
  await getTripById(id);
  const trip = await prisma.trip.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  logger.info('Trip soft-deleted', { tripId: id });
  return trip;
}
