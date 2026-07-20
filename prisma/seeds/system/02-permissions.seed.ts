// ================================================================
// SYSTEM SEED: Permissions
// ================================================================
// Purpose: Create static permissions for RBAC
// Tables: Permission
// ================================================================

import { PrismaClient } from '@prisma/client';

export async function seedPermissions(prisma: PrismaClient) {
  console.log('🔐 Creating Permissions...');

  const permissions = [
    // User Permissions
    { name: 'user.create', resource: 'user', action: 'create', desc: 'Create new user accounts' },
    { name: 'user.read', resource: 'user', action: 'read', desc: 'View user profiles and lists' },
    { name: 'user.update', resource: 'user', action: 'update', desc: 'Update user information' },
    { name: 'user.delete', resource: 'user', action: 'delete', desc: 'Delete user accounts' },
    
    // Role Permissions
    { name: 'role.manage', resource: 'role', action: 'manage', desc: 'Create, update, and delete roles' },
    
    // Bus Permissions
    { name: 'bus.create', resource: 'bus', action: 'create', desc: 'Add new buses to the fleet' },
    { name: 'bus.read', resource: 'bus', action: 'read', desc: 'View bus details and list' },
    { name: 'bus.update', resource: 'bus', action: 'update', desc: 'Update bus information' },
    { name: 'bus.delete', resource: 'bus', action: 'delete', desc: 'Remove buses from the system' },
    
    // Terminal Permissions
    { name: 'terminal.create', resource: 'terminal', action: 'create', desc: 'Create new terminals' },
    { name: 'terminal.read', resource: 'terminal', action: 'read', desc: 'View terminal details' },
    { name: 'terminal.update', resource: 'terminal', action: 'update', desc: 'Update terminal information' },
    { name: 'terminal.delete', resource: 'terminal', action: 'delete', desc: 'Delete terminals' },
    
    // Route Permissions
    { name: 'route.create', resource: 'route', action: 'create', desc: 'Create new routes' },
    { name: 'route.read', resource: 'route', action: 'read', desc: 'View route details' },
    { name: 'route.update', resource: 'route', action: 'update', desc: 'Update route information' },
    { name: 'route.delete', resource: 'route', action: 'delete', desc: 'Delete routes' },
    
    // Trip Permissions
    { name: 'trip.create', resource: 'trip', action: 'create', desc: 'Create new trips' },
    { name: 'trip.read', resource: 'trip', action: 'read', desc: 'View trip details' },
    { name: 'trip.update', resource: 'trip', action: 'update', desc: 'Update trip information' },
    { name: 'trip.delete', resource: 'trip', action: 'delete', desc: 'Delete trips' },
    
    // Schedule Permissions
    { name: 'schedule.create', resource: 'schedule', action: 'create', desc: 'Create new schedules' },
    { name: 'schedule.read', resource: 'schedule', action: 'read', desc: 'View schedule details' },
    { name: 'schedule.update', resource: 'schedule', action: 'update', desc: 'Update schedule information' },
    
    // Incident Permissions
    { name: 'incident.create', resource: 'incident', action: 'create', desc: 'Report new incidents' },
    { name: 'incident.read', resource: 'incident', action: 'read', desc: 'View incident reports' },
    { name: 'incident.resolve', resource: 'incident', action: 'resolve', desc: 'Resolve and close incidents' },
    
    // Notification Permissions
    { name: 'notification.send', resource: 'notification', action: 'send', desc: 'Send system notifications' },
    
    // Dashboard Permissions
    { name: 'dashboard.view', resource: 'dashboard', action: 'view', desc: 'View system dashboard' },
  ];

  const created = [];
  for (const p of permissions) {
    const result = await prisma.permission.upsert({
      where: { permission_name: p.name },
      update: {},
      create: {
        permission_name: p.name,
        resource: p.resource,
        action: p.action,
        description: p.desc,
      },
    });
    created.push(result);
  }

  console.log(`✅ ${created.length} permissions created`);
  return created;
}