// ================================================================
// SYSTEM SEED: Roles
// ================================================================
// Purpose: Create static roles for RBAC
// Tables: Role
// ================================================================

import { PrismaClient } from '@prisma/client';

export async function seedRoles(prisma: PrismaClient) {
  console.log('🎭 Creating Roles...');

  const roles = [
    { name: 'Administrator', description: 'Full system access with all permissions' },
    { name: 'Dispatcher', description: 'Manage operations, trips, and assignments' },
    { name: 'Driver', description: 'View trips, report incidents, update status' },
    { name: 'Passenger', description: 'View schedules, track buses, get notifications' },
    { name: 'Fleet Manager', description: 'Manage buses, maintenance, and fleet operations' },
  ];

  const created = [];
  for (const role of roles) {
    const result = await prisma.role.upsert({
      where: { role_name: role.name },
      update: {},
      create: {
        role_name: role.name,
        description: role.description,
      },
    });
    created.push(result);
  }

  console.log(`✅ ${created.length} roles created`);
  return created;
}