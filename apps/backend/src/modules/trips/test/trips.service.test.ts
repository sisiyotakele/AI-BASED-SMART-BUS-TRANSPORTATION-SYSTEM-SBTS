import { prismaTest, resetDatabase } from '@/common/test-utils/test-db';
import * as tripService from '@/modules/trips/trips.service';
import { BadRequestError, ConflictError } from '@/common/errors';
import { createTerminal, createBus, createStop, createRoute, createRouteVersion, createUser, createSchedule } from '@/common/test-utils/factories';

describe('Trip Management Service', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  async function setupTripDeps() {
    const terminal = await createTerminal();
    const bus = await createBus({ terminalId: terminal.id });
    const driver = await createUser({ licenseNumber: 'LIC123', licenseExpiry: new Date(Date.now() + 86400000) });
    const startStop = await createStop();
    const endStop = await createStop();
    const route = await createRoute({ startStopId: startStop.id, endStopId: endStop.id });
    const version = await createRouteVersion({ routeId: route.id, isActive: true });
    const schedule = await createSchedule({ routeId: route.id, versionId: version.id });
    return { bus, driver, version, schedule };
  }

  describe('createTrip', () => {
    it('should create a scheduled trip', async () => {
      const { bus, driver, version, schedule } = await setupTripDeps();
      const start = new Date(Date.now() + 3600000);
      const end = new Date(Date.now() + 7200000);

      const trip = await tripService.createTrip({
        busId: bus.id,
        driverId: driver.id,
        versionId: version.id,
        scheduleId: schedule.id,
        scheduledStart: start,
        scheduledEnd: end,
      });

      expect(trip.status).toBe('scheduled');
      expect(trip.busId).toBe(bus.id);
      expect(trip.driverId).toBe(driver.id);
    });

    it('should reject bus double-booking', async () => {
      const { bus, driver, version, schedule } = await setupTripDeps();
      const start = new Date(Date.now() + 3600000);
      const end = new Date(Date.now() + 7200000);

      await tripService.createTrip({ busId: bus.id, driverId: driver.id, versionId: version.id, scheduleId: schedule.id, scheduledStart: start, scheduledEnd: end });

      const driver2 = await createUser({ licenseNumber: 'LIC456', licenseExpiry: new Date(Date.now() + 86400000) });
      await expect(tripService.createTrip({
        busId: bus.id,
        driverId: driver2.id,
        versionId: version.id,
        scheduleId: schedule.id,
        scheduledStart: start,
        scheduledEnd: end,
      })).rejects.toThrow(ConflictError);
    });

    it('should reject driver double-booking', async () => {
      const { bus, driver, version, schedule } = await setupTripDeps();
      const bus2 = await createBus();
      const start = new Date(Date.now() + 3600000);
      const end = new Date(Date.now() + 7200000);

      await tripService.createTrip({ busId: bus.id, driverId: driver.id, versionId: version.id, scheduleId: schedule.id, scheduledStart: start, scheduledEnd: end });

      await expect(tripService.createTrip({
        busId: bus2.id,
        driverId: driver.id,
        versionId: version.id,
        scheduleId: schedule.id,
        scheduledStart: start,
        scheduledEnd: end,
      })).rejects.toThrow(ConflictError);
    });
  });

  describe('state machine transitions', () => {
    it('should allow scheduled → active', async () => {
      const { bus, driver, version, schedule } = await setupTripDeps();
      const trip = await tripService.createTrip({
        busId: bus.id, driverId: driver.id, versionId: version.id, scheduleId: schedule.id,
        scheduledStart: new Date(Date.now() + 3600000), scheduledEnd: new Date(Date.now() + 7200000),
      });
      const updated = await tripService.startTrip(trip.id);
      expect(updated.status).toBe('active');
      expect(updated.actualStart).not.toBeNull();
    });

    it('should allow active → paused → active → completed', async () => {
      const { bus, driver, version, schedule } = await setupTripDeps();
      const trip = await tripService.createTrip({
        busId: bus.id, driverId: driver.id, versionId: version.id, scheduleId: schedule.id,
        scheduledStart: new Date(Date.now() + 3600000), scheduledEnd: new Date(Date.now() + 7200000),
      });
      await tripService.startTrip(trip.id);
      const paused = await tripService.pauseTrip(trip.id);
      expect(paused.status).toBe('paused');
      const resumed = await tripService.resumeTrip(trip.id);
      expect(resumed.status).toBe('active');
      const completed = await tripService.endTrip(trip.id);
      expect(completed.status).toBe('completed');
      expect(completed.actualEnd).not.toBeNull();
    });

    it('should allow scheduled → cancelled', async () => {
      const { bus, driver, version, schedule } = await setupTripDeps();
      const trip = await tripService.createTrip({
        busId: bus.id, driverId: driver.id, versionId: version.id, scheduleId: schedule.id,
        scheduledStart: new Date(Date.now() + 3600000), scheduledEnd: new Date(Date.now() + 7200000),
      });
      const cancelled = await tripService.cancelTrip(trip.id);
      expect(cancelled.status).toBe('cancelled');
    });

    it('should reject invalid transition scheduled → completed', async () => {
      const { bus, driver, version, schedule } = await setupTripDeps();
      const trip = await tripService.createTrip({
        busId: bus.id, driverId: driver.id, versionId: version.id, scheduleId: schedule.id,
        scheduledStart: new Date(Date.now() + 3600000), scheduledEnd: new Date(Date.now() + 7200000),
      });
      await expect(tripService.endTrip(trip.id))
        .rejects.toThrow(BadRequestError);
    });

    it('should reject invalid transition completed → active', async () => {
      const { bus, driver, version, schedule } = await setupTripDeps();
      const trip = await tripService.createTrip({
        busId: bus.id, driverId: driver.id, versionId: version.id, scheduleId: schedule.id,
        scheduledStart: new Date(Date.now() + 3600000), scheduledEnd: new Date(Date.now() + 7200000),
      });
      await tripService.startTrip(trip.id);
      await tripService.endTrip(trip.id);
      await expect(tripService.startTrip(trip.id))
        .rejects.toThrow(BadRequestError);
    });
  });
});
