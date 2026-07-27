import { NotFoundError, ConflictError, BadRequestError } from '@/common/errors';
import { logger } from '@/common/logger';
import * as repository from './trips.repository';

// Allow test injection
export function setPrismaClient(client: any) {
  repository.setPrismaClient(client);
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['paused', 'completed', 'cancelled'],
  paused: ['in_progress'],
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
  return repository.executeTransaction(
    async (tx) => {
      // LAYER 1: Explicit checks for clear error messages
      // These run first to provide user-friendly error messages
      // If they pass but a race condition occurs, the DB constraint will catch it

      const busOverlap = await repository.findBusOverlappingTrip(
        tx,
        data.busId,
        data.scheduledStart,
        data.scheduledEnd
      );

      if (busOverlap) {
        throw new ConflictError(
          `Bus ${data.busId} already has a trip scheduled from ${busOverlap.scheduledStart.toISOString()} to ${busOverlap.scheduledEnd.toISOString()}`,
          'BUS_DOUBLE_BOOKED'
        );
      }

      const driverOverlap = await repository.findDriverOverlappingTrip(
        tx,
        data.driverId,
        data.scheduledStart,
        data.scheduledEnd
      );

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
        const trip = await repository.createTrip(tx, data);

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
  return repository.findTrips(where);
}

export async function getTripById(id: string) {
  const trip = await repository.findTripById(id);
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
  const updated = await repository.updateTrip(id, data);
  logger.info(`Trip ${newStatus}`, { tripId: id });
  return updated;
}

export async function startTrip(id: string) {
  return transitionTrip(id, 'in_progress', { actualStart: new Date() });
}

export async function pauseTrip(id: string) {
  return transitionTrip(id, 'paused');
}

export async function resumeTrip(id: string) {
  return transitionTrip(id, 'in_progress');
}

export async function endTrip(id: string) {
  return transitionTrip(id, 'completed', { actualEnd: new Date() });
}

export async function cancelTrip(id: string) {
  return transitionTrip(id, 'cancelled');
}

export async function deleteTrip(id: string, _actorId?: string) {
  await getTripById(id);
  const trip = await repository.softDeleteTrip(id);
  logger.info('Trip soft-deleted', { tripId: id });
  return trip;
}
