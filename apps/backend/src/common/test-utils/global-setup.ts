import { execSync } from 'child_process';

export default async function globalSetup() {
  const testDbUrl = process.env.TEST_DATABASE_URL;

  if (!testDbUrl) {
    console.warn('⚠️  TEST_DATABASE_URL not set. Integration tests will be skipped.');
    process.exit(0);
  }

  console.log('🧪 Setting up test database...');
  
  // Use db push instead of migrate deploy to avoid migration file issues
  execSync('npx prisma db push --force-reset --skip-generate', {
    env: { ...process.env, DATABASE_URL: testDbUrl },
    stdio: 'inherit',
  });

  console.log('🌱 Seeding test database...');
  
  // Run seed
  execSync('npx tsx src/prisma/seed.ts', {
    env: { ...process.env, DATABASE_URL: testDbUrl },
    stdio: 'inherit',
  });

  console.log('✅ Test database ready');
}
