import assert from 'node:assert/strict';
import test from 'node:test';

test('loginUser returns token for valid demo user', async () => {
  const { loginUser } = await import('../dist/modules/auth/auth.service.js');
  const res = await loginUser({ email: 'admin@example.com', password: 'admin123' });
  assert.ok(res.token, 'Expected a token to be returned');
  assert.equal(res.user.email, 'admin@example.com');
});

test('loginUser throws for invalid credentials', async () => {
  const { loginUser } = await import('../dist/modules/auth/auth.service.js');
  await assert.rejects(async () => {
    await loginUser({ email: 'admin@example.com', password: 'wrong-password' });
  }, {
    message: 'Invalid email or password'
  });
});
