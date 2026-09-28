import { NotFoundError, ConflictError, BadRequestError } from '@/common/errors';
import { logger } from '@/common/logger';
import * as repository from './trips.repository';

// Allow test injection
export function setPrismaClient(client: any) {
  repository.setPrismaClient(client);
}

const VALID_TRANSITIONS: Record<string, string[]> = {
  scheduled: ['in_progress', 'cancelled', 'completed', 'paused'],
  in_progress: ['paused', 'completed', 'cancelled', 'scheduled'],
  paused: ['in_progress', 'completed', 'cancelled'],
  completed: ['in_progress', 'scheduled', 'cancelled'],
  cancelled: ['scheduled', 'in_progress']
};

function isValidTransition(from: string, to: string): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Preview schedule validation and resolution details for Trip creation
 */
export async function previewScheduleForTrip(scheduleId: string, tripDateStr: string) {
  const parsedDate = new Date(tripDateStr);
  if (isNaN(parsedDate.getTime())) {
    throw new BadRequestError('Invalid trip date format', 'INVALID_DATE');
  }

  const schedule = await repository.findScheduleWithVersionAndStops(scheduleId);
  if (!schedule || !schedule.isActive) {
    throw new BadRequestError('Schedule not found or inactive', 'SCHEDULE_NOT_FOUND');
  }

  // 1. BusRouteAssignment check
  const busAssignment = await repository.findBusRouteAssignmentForSchedule(scheduleId, schedule.routeId);
  const bus = busAssignment?.bus || null;
  const hasBus = !!bus;

  // 2. BusDriverAssignment & Shift check
  let driver: any = null;
  let shift: any = null;
  let busDriverAssignment: any = null;

  if (bus) {
    busDriverAssignment = await repository.findBusDriverAssignmentForBusAndDate(bus.id, parsedDate);
    if (busDriverAssignment) {
      shift = busDriverAssignment.shift || null;
      driver = shift?.driver || null;
    }
  }

  const hasDriver = !!(driver && shift);
  const isAssignmentValid = hasBus && hasDriver && busDriverAssignment?.status === 'active' && driver?.isActive === true;

  // 3. Duplicate check
  const existingTrip = await repository.findTripByScheduleAndDate(scheduleId, parsedDate);
  const hasDuplicate = !!existingTrip;

  let validationMessage = 'Ready to generate trip';
  if (!hasBus) {
    validationMessage = 'Cannot generate trip — no bus is assigned to this schedule.';
  } else if (!hasDriver) {
    validationMessage = 'Cannot generate trip — no driver is assigned to this service.';
  } else if (!isAssignmentValid) {
    validationMessage = 'Cannot generate trip — driver and bus assignment is not valid.';
  } else if (hasDuplicate) {
    validationMessage = 'Trip already exists for this schedule and date.';
  }

  const departureTimeString = schedule.departureTime 
    ? new Date(schedule.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) 
    : '06:00';

  return {
    schedule: {
      id: schedule.id,
      scheduleName: schedule.scheduleName,
      routeName: schedule.route?.routeName || 'N/A',
      direction: schedule.version?.direction || 'forward',
      departureTime: departureTimeString,
      startTerminalName: schedule.route?.startTerminal?.terminalName || 'Terminal A',
      endTerminalName: schedule.route?.endTerminal?.terminalName || 'Terminal B',
      stopsCount: schedule.version?.routeStops?.length || 0,
      stops: schedule.version?.routeStops?.map((rs: any) => rs.stop?.stopName).filter(Boolean) || []
    },
    bus: bus ? { id: bus.id, plateNumber: bus.plateNumber, model: bus.model } : null,
    driver: driver ? { id: driver.id, fullName: driver.fullName } : null,
    shift: shift ? {
      id: shift.id,
      shiftStart: shift.shiftStart ? new Date(shift.shiftStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '06:00',
      shiftEnd: shift.shiftEnd ? new Date(shift.shiftEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '14:00'
    } : null,
    checks: {
      busAssigned: hasBus,
      driverAssigned: hasDriver,
      assignmentValid: isAssignmentValid,
      noDuplicate: !hasDuplicate,
      readyToGenerate: hasBus && hasDriver && isAssignmentValid && !hasDuplicate
    },
    isReady: hasBus && hasDriver && isAssignmentValid && !hasDuplicate,
    validationMessage
  };
}

/**
 * Create a trip by combining existing Schedule, Bus, Driver, and Shift records
 */
export async function createTripFromSchedule(scheduleId: string, tripDateStr: string, actorId?: string): Promise<any> {
  const parsedDate = new Date(tripDateStr);
  if (isNaN(parsedDate.getTime())) {
    throw new BadRequestError('Invalid trip date format', 'INVALID_DATE');
  }

  // 1. Verify Schedule
  const schedule = await repository.findScheduleWithVersionAndStops(scheduleId);
  if (!schedule || !schedule.isActive) {
    throw new BadRequestError('Cannot generate trip — schedule not found or inactive.', 'SCHEDULE_NOT_FOUND');
  }

  // 2. Bus Assignment check
  const busAssignment = await repository.findBusRouteAssignmentForSchedule(scheduleId, schedule.routeId);
  if (!busAssignment || !busAssignment.bus) {
    throw new BadRequestError('Cannot generate trip — no bus is assigned to this schedule.', 'NO_BUS_ASSIGNED');
  }
  const bus = busAssignment.bus;

  // 3. Driver & Shift check
  const busDriverAssignment = await repository.findBusDriverAssignmentForBusAndDate(bus.id, parsedDate);
  if (!busDriverAssignment || !busDriverAssignment.shift || !busDriverAssignment.shift.driver) {
    throw new BadRequestError('Cannot generate trip — no driver is assigned to this service.', 'NO_DRIVER_ASSIGNED');
  }

  const shift = busDriverAssignment.shift;
  const driver = shift.driver;

  // 4. Driver-Bus assignment validity check
  if (busDriverAssignment.status !== 'active' || driver.isActive === false) {
    throw new BadRequestError('Cannot generate trip — driver and bus assignment is not valid.', 'INVALID_DRIVER_BUS_ASSIGNMENT');
  }

  // 5. Duplicate check
  const existingTrip = await repository.findTripByScheduleAndDate(scheduleId, parsedDate);
  if (existingTrip) {
    throw new ConflictError('Trip already exists for this schedule and date.', 'TRIP_ALREADY_EXISTS');
  }

  // Calculate scheduledStart & scheduledEnd
  const scheduledStart = new Date(parsedDate);
  if (schedule.departureTime) {
    const depDate = new Date(schedule.departureTime);
    scheduledStart.setHours(depDate.getHours(), depDate.getMinutes(), 0, 0);
  } else {
    scheduledStart.setHours(6, 0, 0, 0);
  }

  const scheduledEnd = new Date(scheduledStart.getTime() + 120 * 60000);

  const tripData = {
    scheduleId: schedule.id,
    versionId: schedule.versionId,
    busId: bus.id,
    driverId: driver.id,
    shiftId: shift.id,
    tripDate: parsedDate,
    scheduledStart,
    scheduledEnd,
    status: 'scheduled'
  };

  return createTrip(tripData, actorId);
}

/**
 * Create a new trip with proper double-booking prevention
 */
export async function createTrip(data: any, actorId?: string): Promise<any> {
  // If schedule is supplied without manual bus assignment, escalate to auto-orchestrator
  if (data.scheduleId && !data.busId) {
    const tripDateStr = data.tripDate || new Date().toISOString().split('T')[0];
    return createTripFromSchedule(data.scheduleId, tripDateStr, actorId);
  }


  // Auto-calculate scheduledEnd if not provided
  if (!data.scheduledEnd) {
    const duration = data.estimatedDurationMinutes || 120; // Default 2 hours
    const startDate = new Date(data.scheduledStart);
    data.scheduledEnd = new Date(startDate.getTime() + duration * 60000);
  }

  return repository.executeTransaction(
    async (tx) => {
      try {
        const trip = await repository.createTrip(tx, data);

        logger.info('Trip created successfully', {
          tripId: trip.id,
          busId: data.busId,
          driverId: data.driverId
        });

        return trip;
      } catch (error: any) {
        if (error.code === '23P01') {
          // If DB exclusion constraint throws, we swallow it and allow creation ?
          // Wait, if it throws from the DB, we cannot proceed because the SQL transaction aborted!
          // We must just throw it. We'll throw a ConflictError but maybe just generically.
          throw new ConflictError('Overlapping trip detected by underlying system constraint', 'DB_CONSTRAINT_ERROR');
        }
        throw error;
      }
    },
    {
      isolationLevel: 'Serializable',
      maxWait: 5000,
      timeout: 10000,
    }
  );
}

export async function listTrips(filters: { driverId?: string; status?: string; busId?: string; date?: Date; routeId?: string } = {}) {
  const where: any = { deletedAt: null };
  if (filters.driverId) where.driverId = filters.driverId;
  if (filters.status && filters.status !== 'all') where.status = filters.status;
  if (filters.busId) where.busId = filters.busId;
  if (filters.routeId) where.schedule = { routeId: filters.routeId };
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
  const trip = await transitionTrip(id, 'in_progress', { actualStart: new Date() });

  // Fire-and-forget GPS seed - do not await, must not block the response
  setImmediate(async () => {
    try {
      const { prisma } = await import('@/prisma/client');
      await prisma.busLiveLocation.create({
        data: {
          busId: trip.busId,
          tripId: trip.id,
          driverId: trip.driverId,
          latitude: 8.98 + (Math.random() - 0.5) * 0.05,
          longitude: 38.75 + (Math.random() - 0.5) * 0.05,
          speed: Math.floor(Math.random() * 40) + 5,
          direction: Math.floor(Math.random() * 360),
          recordedAt: new Date(),
        }
      });
      logger.info('Simulated GPS start point created for trip', { tripId: id });
    } catch (e) {
      logger.warn('Failed to inject simulated GPS start point', { error: e });
    }
  });

  return trip;
}

export async function pauseTrip(id: string) {
  const trip = await getTripById(id);
  // Idempotent: if already paused, return current state without error  
  if (trip.status === 'paused') return trip;
  return transitionTrip(id, 'paused');
}

export async function resumeTrip(id: string) {
  const trip = await getTripById(id);
  // Idempotent: if already in_progress, return current state without error
  if (trip.status === 'in_progress') return trip;
  return transitionTrip(id, 'in_progress');
}

export async function endTrip(id: string) {
  const trip = await getTripById(id);
  // Allow ending from any active state
  if (trip.status === 'completed') return trip;
  if (!['scheduled', 'in_progress', 'paused'].includes(trip.status)) {
    throw new BadRequestError(`Cannot end trip with status '${trip.status}'`, 'INVALID_STATE_TRANSITION');
  }
  return repository.updateTrip(id, { status: 'completed', actualEnd: new Date() });
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
