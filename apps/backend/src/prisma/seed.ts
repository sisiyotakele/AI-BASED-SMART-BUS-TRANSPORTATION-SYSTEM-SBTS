import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // ============================================================
  // 1. PERMISSIONS
  // ============================================================
  const permissionsData = [
    // Fleet
    { permissionName: 'manage_fleet', resource: 'buses', action: 'manage', description: 'Full CRUD on fleet' },
    { permissionName: 'view_fleet', resource: 'buses', action: 'read', description: 'View fleet data' },
    
    // Terminals
    { permissionName: 'manage_terminals', resource: 'terminals', action: 'manage', description: 'Full CRUD on terminals' },
    { permissionName: 'view_terminals', resource: 'terminals', action: 'read', description: 'View terminals' },
    
    // Routes & Stops
    { permissionName: 'manage_routes', resource: 'routes', action: 'manage', description: 'Full CRUD on routes and stops' },
    { permissionName: 'view_routes', resource: 'routes', action: 'read', description: 'View routes and stops' },
    
    // Drivers / Users
    { permissionName: 'manage_drivers', resource: 'drivers', action: 'manage', description: 'Create and manage driver accounts' },
    { permissionName: 'view_drivers', resource: 'drivers', action: 'read', description: 'View driver profiles' },
    
    // Shifts
    { permissionName: 'manage_shifts', resource: 'shifts', action: 'manage', description: 'Full CRUD on shifts' },
    { permissionName: 'view_shifts', resource: 'shifts', action: 'read', description: 'View shifts' },
    
    // Pricing
    { permissionName: 'manage_pricing', resource: 'prices', action: 'manage', description: 'Manage fare pricing' },
    { permissionName: 'view_pricing', resource: 'prices', action: 'read', description: 'View pricing' },
    
    // Schedules
    { permissionName: 'manage_schedules', resource: 'schedules', action: 'manage', description: 'Manage bus schedules' },
    { permissionName: 'view_schedules', resource: 'schedules', action: 'read', description: 'View schedules' },
    
    // Assignments
    { permissionName: 'manage_assignments', resource: 'assignments', action: 'manage', description: 'Manage bus-driver and bus-route assignments' },
    { permissionName: 'view_assignments', resource: 'assignments', action: 'read', description: 'View assignments' },
    
    // Key Handovers
    { permissionName: 'manage_key_handovers', resource: 'key_handovers', action: 'manage', description: 'Manage key handovers' },
    { permissionName: 'view_key_handovers', resource: 'key_handovers', action: 'read', description: 'View key handovers' },
    
    // Trips
    { permissionName: 'create_trip', resource: 'trips', action: 'create', description: 'Create new trips' },
    { permissionName: 'start_trip', resource: 'trips', action: 'start', description: 'Start a trip (driver)' },
    { permissionName: 'end_trip', resource: 'trips', action: 'end', description: 'End a trip (driver)' },
    { permissionName: 'cancel_trip', resource: 'trips', action: 'cancel', description: 'Cancel a trip' },
    { permissionName: 'view_trips', resource: 'trips', action: 'read', description: 'View trips' },
    
    // Incidents
    { permissionName: 'report_incident', resource: 'incidents', action: 'create', description: 'Report incidents (driver)' },
    { permissionName: 'resolve_incident', resource: 'incidents', action: 'resolve', description: 'Resolve incidents (admin)' },
    { permissionName: 'view_incidents', resource: 'incidents', action: 'read', description: 'View incidents' },
    
    // Notifications
    { permissionName: 'manage_notifications', resource: 'notifications', action: 'manage', description: 'Send and manage notifications' },
    
    // AI
    { permissionName: 'manage_ai_models', resource: 'ai_models', action: 'manage', description: 'Manage AI prediction models' },
    { permissionName: 'view_predictions', resource: 'predictions', action: 'read', description: 'View traffic predictions' },
    
    // Reporting
    { permissionName: 'generate_report', resource: 'reports', action: 'create', description: 'Generate operational reports' },
    { permissionName: 'view_reports', resource: 'reports', action: 'read', description: 'View reports' },
    
    // RBAC
    { permissionName: 'manage_roles', resource: 'roles', action: 'manage', description: 'Manage roles and permissions' },
    { permissionName: 'view_roles', resource: 'roles', action: 'read', description: 'View roles and permissions' },
    { permissionName: 'assign_roles', resource: 'user_roles', action: 'manage', description: 'Assign roles to users' },
    
    // Audit
    { permissionName: 'view_audit_logs', resource: 'audit_logs', action: 'read', description: 'View audit logs' },
  ];

  const permissions = await Promise.all(
    permissionsData.map((p: any) =>
      prisma.permission.upsert({
        where: { permissionName: p.permissionName },
        update: {},
        create: p,
      })
    )
  );

  console.log(`✅ Seeded ${permissions.length} permissions`);

  // ============================================================
  // 2. ROLES
  // ============================================================
  const adminRole = await prisma.role.upsert({
    where: { roleName: 'admin' },
    update: {},
    create: {
      roleName: 'admin',
      description: 'System Administrator with full access',
    },
  });

  const driverRole = await prisma.role.upsert({
    where: { roleName: 'driver' },
    update: {},
    create: {
      roleName: 'driver',
      description: 'Bus Driver with operational permissions',
    },
  });

  const passengerRole = await prisma.role.upsert({
    where: { roleName: 'passenger' },
    update: {},
    create: {
      roleName: 'passenger',
      description: 'Passenger with read-only public access',
    },
  });

  console.log('✅ Seeded 3 roles: admin, driver, passenger');

  // ============================================================
  // 3. ROLE PERMISSIONS
  // ============================================================
  const permissionMap = new Map(permissions.map((p: any) => [p.permissionName, p.id]));

  // Admin gets everything
  const adminPermissions = permissions.map(p => ({
    roleId: adminRole.id,
    permissionId: p.id,
  }));

  // Driver gets operational permissions
  const driverPermissionNames = [
    'view_fleet', 'view_terminals', 'view_routes', 'view_shifts', 'view_schedules',
    'view_assignments', 'view_key_handovers', 'start_trip', 'end_trip', 'view_trips',
    'report_incident', 'view_incidents', 'view_predictions', 'view_pricing',
  ];
  const driverPermissions = driverPermissionNames
    .map(name => permissionMap.get(name))
    .filter((id): id is string => !!id)
    .map(permissionId => ({
      roleId: driverRole.id,
      permissionId,
    }));

  // Passenger gets minimal read access
  const passengerPermissionNames = [
    'view_routes', 'view_terminals', 'view_schedules', 'view_pricing', 'view_predictions',
  ];
  const passengerPermissions = passengerPermissionNames
    .map(name => permissionMap.get(name))
    .filter((id): id is string => !!id)
    .map(permissionId => ({
      roleId: passengerRole.id,
      permissionId,
    }));

  await prisma.rolePermission.deleteMany({});
  await prisma.rolePermission.createMany({
    data: [...adminPermissions, ...driverPermissions, ...passengerPermissions],
    skipDuplicates: true,
  });

  console.log('✅ Seeded role-permission mappings');
  console.log('   - Admin: all permissions');
  console.log(`   - Driver: ${driverPermissions.length} permissions`);
  console.log(`   - Passenger: ${passengerPermissions.length} permissions`);

  console.log('🎉 Seed completed successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
