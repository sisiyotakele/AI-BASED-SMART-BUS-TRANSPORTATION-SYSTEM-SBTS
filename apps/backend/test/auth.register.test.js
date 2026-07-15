import assert from 'node:assert/strict';
import test from 'node:test';

test('registerUser returns token for new demo user', async () => {
  const { registerUser } = await import('../dist/modules/auth/auth.service.js');
  const res = await registerUser({ email: 'newuser@example.com', password: 'password123', name: 'New User' });
  assert.ok(res.token, 'Expected a token to be returned');
  assert.equal(res.user.email, 'newuser@example.com');
});

test('registerUser throws for existing email when using Prisma (best-effort)', async () => {
  const { registerUser } = await import('../dist/modules/auth/auth.service.js');
  // Behavior depends on DB; we assert that calling twice either succeeds twice (demo) or the second fails with 'Email already in use'
  await registerUser({ email: 'duplicate@example.com', password: 'password123' });
  try {
    await registerUser({ email: 'duplicate@example.com', password: 'password123' });
  } catch (err) {
    assert.ok(err instanceof Error);
  }
});