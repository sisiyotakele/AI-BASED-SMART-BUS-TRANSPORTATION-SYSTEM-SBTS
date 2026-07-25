import request from 'supertest';
import app from '@/app';
import { prismaTest, resetDatabase } from '@/common/test-utils/test-db';
import { testAdminToken, testDriverToken } from '@/common/test-utils/auth-helper';
import { createTerminal, createBus, createStop, createRoute, createRouteVersion, createUser, createSchedule, createTrip } from '@/common/test-utils/factories';

describe('Incident Management Flow Integration', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  async function setupActiveTrip() {
    const terminal = await createTerminal();
    const bus = await createBus({ terminalId: terminal.id });
    const driver = await createUser({ licenseNumber: 'LIC001', licenseExpiry: new Date(Date.now() + 86400000) });
    const startStop = await createStop();
    const endStop = await createStop();
    const route = await createRoute({ startStopId: startStop.id, endStopId: endStop.id });
    const version = await createRouteVersion({ routeId: route.id, isActive: true });
    const schedule = await createSchedule({ routeId: route.id, versionId: version.id });
    const trip = await createTrip({
      busId: bus.id, driverId: driver.id, versionId: version.id, scheduleId: schedule.id,
      scheduledStart: new Date(Date.now() - 3600000), scheduledEnd: new Date(Date.now() + 3600000),
      status: 'in_progress',
    });
    return { trip, bus, driver };
  }

  it('should report → review → resolve incident with state machine', async () => {
    const { trip } = await setupActiveTrip();

    const reportRes = await request(app)
      .post('/api/v1/incidents')
      .set('Authorization', `Bearer ${testDriverToken}`)
      .send({
        tripId: trip.id,
        incidentType: 'Breakdown',
        severity: 'high',
        description: 'Engine overheating',
        latitude: 9.03,
        longitude: 38.74,
      });
    expect(reportRes.status).toBe(201);
    expect(reportRes.body.data.status).toBe('reported');
    const incidentId = reportRes.body.data.id;

    const reviewRes = await request(app)
      .patch(`/api/v1/incidents/${incidentId}/review`)
      .set('Authorization', `Bearer ${testAdminToken}`);
    expect(reviewRes.status).toBe(200);
    expect(reviewRes.body.data.status).toBe('investigating');

    const resolveRes = await request(app)
      .patch(`/api/v1/incidents/${incidentId}/resolve`)
      .set('Authorization', `Bearer ${testAdminToken}`)
      .send({ resolutionNotes: 'Mechanic dispatched, bus replaced' });
    expect(resolveRes.status).toBe(200);
    expect(resolveRes.body.data.status).toBe('resolved');
    expect(resolveRes.body.data.resolutionNotes).toBe('Mechanic dispatched, bus replaced');
    expect(resolveRes.body.data.resolvedAt).not.toBeNull();

    const invalidRes = await request(app)
      .patch(`/api/v1/incidents/${incidentId}/review`)
      .set('Authorization', `Bearer ${testAdminToken}`);
    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.error.code).toBe('INVALID_TRANSITION');
  });
});
