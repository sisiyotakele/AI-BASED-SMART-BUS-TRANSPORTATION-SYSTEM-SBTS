// ================================================================
// SYSTEM SEED: Role Permissions
// ================================================================
// Purpose: Assign permissions to roles
// Dependency: 01-roles.seed.ts, 02-permissions.seed.ts
// Tables: RolePermission
// ================================================================

import { PrismaClient } from '@prisma/client';

export async function seedRolePermissions(prisma: PrismaClient) {
  console.log('🔗 Assigning Permissions to Roles...');

  const roles = await prisma.role.findMany();
  const permissions = await prisma.permission.findMany();

  const roleMap = Object.fromEntries(roles.map(r => [r.role_name, r.id]));
  const permMap = Object.fromEntries(permissions.map(p => [p.permission_name, p.id]));

  // Define which permissions go to which role
  const assignments = {
    Administrator: permissions.map(p => p.permission_name),
    Dispatcher: [
      'trip.create', 'trip.read', 'trip.update',
      'schedule.create', 'schedule.read', 'schedule.update',
      'incident.create', 'incident.read', 'incident.resolve',
      'dashboard.view',
    ],
    Driver: [
      'trip.read',
      'incident.create', 'incident.read',
    ],
    Passenger: [
      'trip.read',
      'dashboard.view',
    ],
    'Fleet Manager': [
      'bus.create', 'bus.read', 'bus.update', 'bus.delete',
      'terminal.create', 'terminal.read', 'terminal.update', 'terminal.delete',
    ],
  };

  let total = 0;
  for (const [roleName, permNames] of Object.entries(assignments)) {
    const roleId = roleMap[roleName];
    if (!roleId) continue;

    for (const permName of permNames) {
      const permissionId = permMap[permName];
      if (!permissionId) continue;

      try {
        await prisma.rolePermission.upsert({
          where: {
            role_id_permission_id: {
              role_id: roleId,
              permission_id: permissionId,
            },
          },
          update: {},
          create: {
            role_id: roleId,
            permission_id: permissionId,
          },
        });
        total++;
      } catch (error) {
        // Skip duplicates
      }
    }
  }

  console.log(`✅ ${total} role-permission assignments created`);
}