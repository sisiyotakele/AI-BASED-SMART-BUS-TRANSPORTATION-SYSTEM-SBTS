import request from 'supertest';
import app from '@/app';
import { prismaTest, resetDatabase } from '@/common/test-utils/test-db';

describe('Auth Flow Integration', () => {
  beforeEach(async () => {
    await resetDatabase();
    await prismaTest.role.create({ data: { roleName: 'PASSENGER', description: 'Passenger' } });
  });

  it('should register → login → access protected route → logout', async () => {
    const registerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        fullName: 'Abebe Kebede',
        email: 'abebe@flow.com',
        phone: '+251911111111',
        password: 'SecurePass123!',
      });
    expect(registerRes.status).toBe(201);
    expect(registerRes.body.success).toBe(true);

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'abebe@flow.com', password: 'SecurePass123!' });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.accessToken).toBeDefined();
    const token = loginRes.body.data.accessToken;
    const refreshToken = loginRes.body.data.refreshToken;

    const meRes = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('abebe@flow.com');

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken });
    expect(logoutRes.status).toBe(200);

    const history = await prismaTest.loginHistory.findMany({
      where: { userId: registerRes.body.data.userId },
      orderBy: { createdAt: 'asc' },
    });
    expect(history.length).toBeGreaterThanOrEqual(2);
    expect(history.some((h: any) => h.action === 'login_success')).toBe(true);
    expect(history.some((h: any) => h.action === 'logout')).toBe(true);
  });

  it('should reject access without token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should reject access with invalid token', async () => {
    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer invalid.token.here');
    expect(res.status).toBe(401);
  });
});
