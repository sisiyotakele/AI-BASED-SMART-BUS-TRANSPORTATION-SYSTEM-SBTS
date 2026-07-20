import request from 'supertest';
import app from '@/app';
import { resetDatabase } from '@/common/test-utils/test-db';
import { testAdminToken, testDriverToken, testPassengerToken } from '@/common/test-utils/auth-helper';

describe.skip('RBAC Permission Enforcement Integration', () => {
  // These tests require bus and route modules to be implemented first
  beforeEach(async () => {
    await resetDatabase();
  });

  it('should allow admin to create buses', async () => {
    const res = await request(app)
      .post('/api/v1/buses')
      .set('Authorization', `Bearer ${testAdminToken}`)
      .send({ plateNumber: 'ABC123', model: 'Toyota', capacity: 50 });
    expect(res.status).toBe(201);
  });

  it('should deny driver from creating buses', async () => {
    const res = await request(app)
      .post('/api/v1/buses')
      .set('Authorization', `Bearer ${testDriverToken}`)
      .send({ plateNumber: 'ABC123', model: 'Toyota', capacity: 50 });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('MISSING_PERMISSION');
  });

  it('should allow driver to view buses', async () => {
    const res = await request(app)
      .get('/api/v1/buses')
      .set('Authorization', `Bearer ${testDriverToken}`);
    expect(res.status).toBe(200);
  });

  it('should allow passenger to view routes but not manage them', async () => {
    const viewRes = await request(app)
      .get('/api/v1/routes/routes')
      .set('Authorization', `Bearer ${testPassengerToken}`);
    expect(viewRes.status).toBe(200);

    const createRes = await request(app)
      .post('/api/v1/routes/routes')
      .set('Authorization', `Bearer ${testPassengerToken}`)
      .send({ routeName: 'Test', startStopId: '00000000-0000-0000-0000-000000000001', endStopId: '00000000-0000-0000-0000-000000000002' });
    expect(createRes.status).toBe(403);
  });
});
