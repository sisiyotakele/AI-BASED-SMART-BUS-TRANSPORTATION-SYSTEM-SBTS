import { execSync } from 'child_process';

export default async function globalSetup() {
  const testDbUrl = process.env.TEST_DATABASE_URL;
  if (!testDbUrl) {
    console.warn('⚠️  TEST_DATABASE_URL not set. Integration tests will be skipped.');
    process.exit(0);
  }

  console.log('🧪 Setting up test database...');

  execSync('npx prisma migrate deploy', {
    env: { ...process.env, DATABASE_URL: testDbUrl },
    stdio: 'inherit',
  });

  console.log('✅ Test database ready');
}
