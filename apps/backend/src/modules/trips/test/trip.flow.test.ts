import request from 'supertest';
import app from '@/app';
import { prismaTest, resetDatabase } from '@/common/test-utils/test-db';
import { testAdminToken } from '@/common/test-utils/auth-helper';
import { createTerminal, createBus, createStop, createRoute, createRouteVersion, createUser, createSchedule } from '@/common/test-utils/factories';

describe('Trip Management Flow Integration', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  async function createTripFixture() {
    const terminal = await createTerminal();
    const bus = await createBus({ terminalId: terminal.id });
    const driver = await createUser({ licenseNumber: 'LIC001', licenseExpiry: new Date(Date.now() + 86400000) });
    const startStop = await createStop();
    const endStop = await createStop();
    const route = await createRoute({ startStopId: startStop.id, endStopId: endStop.id });
    const version = await createRouteVersion({ routeId: route.id, isActive: true });
    const schedule = await createSchedule({ routeId: route.id, versionId: version.id });
    return { bus, driver, version, schedule };
  }

  it('should create trip → start → end with state machine enforcement', async () => {
    const { bus, driver, version, schedule } = await createTripFixture();

    const createRes = await request(app)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${testAdminToken}`)
      .send({
        busId: bus.id,
        driverId: driver.id,
        versionId: version.id,
        scheduleId: schedule.id,
        scheduledStart: new Date(Date.now() + 3600000).toISOString(),
        scheduledEnd: new Date(Date.now() + 7200000).toISOString(),
      });
    expect(createRes.status).toBe(201);
    const tripId = createRes.body.data.id;
    expect(createRes.body.data.status).toBe('scheduled');

    const startRes = await request(app)
      .patch(`/api/v1/trips/${tripId}/start`)
      .set('Authorization', `Bearer ${testAdminToken}`);
    expect(startRes.status).toBe(200);
    expect(startRes.body.data.status).toBe('active');
    expect(startRes.body.data.actualStart).not.toBeNull();

    const invalidStart = await request(app)
      .patch(`/api/v1/trips/${tripId}/start`)
      .set('Authorization', `Bearer ${testAdminToken}`);
    expect(invalidStart.status).toBe(400);
    expect(invalidStart.body.error.code).toBe('INVALID_STATE_TRANSITION');

    const pauseRes = await request(app)
      .patch(`/api/v1/trips/${tripId}/pause`)
      .set('Authorization', `Bearer ${testAdminToken}`);
    expect(pauseRes.status).toBe(200);
    expect(pauseRes.body.data.status).toBe('paused');

    const resumeRes = await request(app)
      .patch(`/api/v1/trips/${tripId}/resume`)
      .set('Authorization', `Bearer ${testAdminToken}`);
    expect(resumeRes.status).toBe(200);
    expect(resumeRes.body.data.status).toBe('active');

    const endRes = await request(app)
      .patch(`/api/v1/trips/${tripId}/end`)
      .set('Authorization', `Bearer ${testAdminToken}`);
    expect(endRes.status).toBe(200);
    expect(endRes.body.data.status).toBe('completed');
    expect(endRes.body.data.actualEnd).not.toBeNull();
  });

  it('should reject double-booking same bus', async () => {
    const { bus, driver, version, schedule } = await createTripFixture();
    const driver2 = await createUser({ licenseNumber: 'LIC002', licenseExpiry: new Date(Date.now() + 86400000) });

    const start = new Date(Date.now() + 3600000).toISOString();
    const end = new Date(Date.now() + 7200000).toISOString();

    await request(app)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${testAdminToken}`)
      .send({ busId: bus.id, driverId: driver.id, versionId: version.id, scheduleId: schedule.id, scheduledStart: start, scheduledEnd: end });

    const secondRes = await request(app)
      .post('/api/v1/trips')
      .set('Authorization', `Bearer ${testAdminToken}`)
      .send({ busId: bus.id, driverId: driver2.id, versionId: version.id, scheduleId: schedule.id, scheduledStart: start, scheduledEnd: end });

    expect(secondRes.status).toBe(409);
    expect(secondRes.body.error.code).toBe('BUS_DOUBLE_BOOKED');
  });
});
