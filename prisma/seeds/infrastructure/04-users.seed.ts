// ================================================================
// INFRASTRUCTURE SEED: Users
// ================================================================
// Purpose: Create admin and test users
// Dependency: 01-roles.seed.ts
// Tables: User, UserRole
// ================================================================

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// Deterministic phone numbers
let phoneCounter = 1;
function nextPhone(): string {
  const prefix = process.env.SEED_PHONE_PREFIX || '+251911';
  const suffix = String(phoneCounter).padStart(6, '0');
  phoneCounter++;
  return `${prefix}${suffix}`;
}

export async function seedUsers(prisma: PrismaClient) {
  console.log('👤 Creating Users (sample/seed accounts)...');

  const ADMIN_PASSWORD = requireEnv('ADMIN_PASSWORD');
  const DEFAULT_PASSWORD = requireEnv('SEED_DEFAULT_PASSWORD');

  const roles = await prisma.role.findMany();
  const roleMap = Object.fromEntries(roles.map(r => [r.role_name, r.id]));

  const users = [];
  const userRoles = [];

  // ----- ADMIN -----
  console.log('   📋 Creating Administrator...');
  const admin = await prisma.user.create({
    data: {
      full_name: process.env.ADMIN_NAME || 'System Administrator',
      email: process.env.ADMIN_EMAIL || 'admin@shegerbus.et',
      phone: process.env.ADMIN_PHONE || nextPhone(),
      password_hash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      status: 'ACTIVE',
      preferred_language: 'English',
      department: 'Administration',
    },
  });
  users.push(admin);
  userRoles.push({ user_id: admin.id, role_id: roleMap['Administrator'] });
  console.log(`   ✅ Admin: ${admin.email}`);

  // ----- DISPATCHERS (3) -----
  console.log('   📋 Creating Dispatchers...');
  const dispatcherPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const dispatchers = [
    { name: 'Meron Abera', email: 'meron.abera@shegerbus.et' },
    { name: 'Daniel Beyene', email: 'daniel.beyene@shegerbus.et' },
    { name: 'Saron Tefera', email: 'saron.tefera@shegerbus.et' },
  ];
  for (const d of dispatchers) {
    const user = await prisma.user.create({
      data: {
        full_name: d.name,
        email: d.email,
        phone: nextPhone(),
        password_hash: dispatcherPassword,
        status: 'ACTIVE',
        preferred_language: 'English',
        department: 'Dispatch',
      },
    });
    users.push(user);
    userRoles.push({ user_id: user.id, role_id: roleMap['Dispatcher'] });
  }
  console.log(`   ✅ ${dispatchers.length} dispatchers created`);

  // ----- FLEET MANAGERS (2) -----
  console.log('   📋 Creating Fleet Managers...');
  const fleetPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const fleetManagers = [
    { name: 'Tekle Hailu', email: 'tekle.hailu@shegerbus.et' },
    { name: 'Genet Kebede', email: 'genet.kebede@shegerbus.et' },
  ];
  for (const fm of fleetManagers) {
    const user = await prisma.user.create({
      data: {
        full_name: fm.name,
        email: fm.email,
        phone: nextPhone(),
        password_hash: fleetPassword,
        status: 'ACTIVE',
        preferred_language: 'English',
        department: 'Fleet Management',
      },
    });
    users.push(user);
    userRoles.push({ user_id: user.id, role_id: roleMap['Fleet Manager'] });
  }
  console.log(`   ✅ ${fleetManagers.length} fleet managers created`);

  // ----- DRIVERS -----
  console.log('   📋 Creating Drivers...');
  const driverPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const driverCount = parseInt(process.env.SEED_DRIVERS_COUNT || '15', 10);
  for (let i = 0; i < driverCount; i++) {
    const user = await prisma.user.create({
      data: {
        full_name: `Driver ${String(i + 1).padStart(2, '0')}`,
        email: `driver${i + 1}@shegerbus.et`,
        phone: nextPhone(),
        password_hash: driverPassword,
        status: 'ACTIVE',
        license_number: `DL-${String(i + 1).padStart(5, '0')}`,
        license_expiry: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000),
        preferred_language: 'English',
        department: 'Operations',
      },
    });
    users.push(user);
    userRoles.push({ user_id: user.id, role_id: roleMap['Driver'] });
  }
  console.log(`   ✅ ${driverCount} drivers created`);

  // ----- PASSENGERS -----
  console.log('   📋 Creating Passengers...');
  const passengerPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const passengerCount = parseInt(process.env.SEED_PASSENGERS_COUNT || '30', 10);
  for (let i = 0; i < passengerCount; i++) {
    const user = await prisma.user.create({
      data: {
        full_name: `Passenger ${String(i + 1).padStart(2, '0')}`,
        email: `passenger${i + 1}@example.com`,
        phone: nextPhone(),
        password_hash: passengerPassword,
        status: 'ACTIVE',
        preferred_language: 'English',
        department: 'Passenger',
      },
    });
    users.push(user);
    userRoles.push({ user_id: user.id, role_id: roleMap['Passenger'] });
  }
  console.log(`   ✅ ${passengerCount} passengers created`);

  // Bulk insert user roles
  await prisma.userRole.createMany({
    data: userRoles,
    skipDuplicates: true,
  });

  console.log(`✅ ${users.length} total users created`);
  return users;
}