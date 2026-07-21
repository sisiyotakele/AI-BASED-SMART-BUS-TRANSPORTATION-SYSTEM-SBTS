import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data in correct order (respecting foreign keys)
  console.log('🧹 Cleaning existing seed data...');
  await prisma.rolePermission.deleteMany({});
  await prisma.userRole.deleteMany({});
  await prisma.permission.deleteMany({});
  await prisma.role.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('📝 Creating permissions...');

  // Define all permissions with correct field names
  const permissions = [
    // User management
    { permissionName: 'users:read', description: 'View users', resource: 'User', action: 'read' },
    { permissionName: 'users:create', description: 'Create users', resource: 'User', action: 'create' },
    { permissionName: 'users:update', description: 'Update users', resource: 'User', action: 'update' },
    { permissionName: 'users:delete', description: 'Delete users', resource: 'User', action: 'delete' },

    // Role management
    { permissionName: 'roles:read', description: 'View roles', resource: 'Role', action: 'read' },
    { permissionName: 'roles:create', description: 'Create roles', resource: 'Role', action: 'create' },
    { permissionName: 'roles:update', description: 'Update roles', resource: 'Role', action: 'update' },
    { permissionName: 'roles:delete', description: 'Delete roles', resource: 'Role', action: 'delete' },

    // Terminal management
    { permissionName: 'terminals:read', description: 'View terminals', resource: 'Terminal', action: 'read' },
    { permissionName: 'terminals:create', description: 'Create terminals', resource: 'Terminal', action: 'create' },
    { permissionName: 'terminals:update', description: 'Update terminals', resource: 'Terminal', action: 'update' },
    { permissionName: 'terminals:delete', description: 'Delete terminals', resource: 'Terminal', action: 'delete' },
    { permissionName: 'view_terminals', description: 'View terminals', resource: 'Terminal', action: 'read' },
    { permissionName: 'manage_terminals', description: 'Manage terminals', resource: 'Terminal', action: 'manage' },

    // Bus management
    { permissionName: 'buses:read', description: 'View buses', resource: 'Bus', action: 'read' },
    { permissionName: 'buses:create', description: 'Create buses', resource: 'Bus', action: 'create' },
    { permissionName: 'buses:update', description: 'Update buses', resource: 'Bus', action: 'update' },
    { permissionName: 'buses:delete', description: 'Delete buses', resource: 'Bus', action: 'delete' },
    { permissionName: 'view_fleet', description: 'View bus fleet', resource: 'Bus', action: 'read' },
    { permissionName: 'manage_fleet', description: 'Manage bus fleet', resource: 'Bus', action: 'manage' },

    // Driver management
    { permissionName: 'drivers:read', description: 'View drivers', resource: 'Driver', action: 'read' },
    { permissionName: 'drivers:create', description: 'Create drivers', resource: 'Driver', action: 'create' },
    { permissionName: 'drivers:update', description: 'Update drivers', resource: 'Driver', action: 'update' },
    { permissionName: 'drivers:delete', description: 'Delete drivers', resource: 'Driver', action: 'delete' },

    // Audit logs
    { permissionName: 'audit:read', description: 'View audit logs', resource: 'AuditLog', action: 'read' },

    // Reports
    { permissionName: 'reports:read', description: 'View reports', resource: 'Report', action: 'read' },
    { permissionName: 'reports:create', description: 'Generate reports', resource: 'Report', action: 'create' },

    // Bookings
    { permissionName: 'bookings:read', description: 'View bookings', resource: 'Booking', action: 'read' },
    { permissionName: 'bookings:create', description: 'Create bookings', resource: 'Booking', action: 'create' },
    { permissionName: 'bookings:update', description: 'Update bookings', resource: 'Booking', action: 'update' },
  ];

  const createdPermissions = await Promise.all(
    permissions.map((permission) =>
      prisma.permission.create({
        data: permission,
      })
    )
  );

  console.log(`✅ Created ${createdPermissions.length} permissions`);

  console.log('👥 Creating roles...');

  // SUPER_ADMIN - All permissions
  const superAdminRole = await prisma.role.create({
    data: {
      roleName: 'SUPER_ADMIN',
      description: 'Full system access',
      rolePermissions: {
        create: createdPermissions.map(p => ({
          permissionId: p.id,
        })),
      },
    },
  });

  // ADMIN - Most permissions except critical system operations
  const adminPermissions = createdPermissions.filter(p =>
    !p.permissionName.includes('roles:delete') &&
    !p.permissionName.includes('users:delete')
  );

  const adminRole = await prisma.role.create({
    data: {
      roleName: 'ADMIN',
      description: 'Administrative access',
      rolePermissions: {
        create: adminPermissions.map(p => ({
          permissionId: p.id,
        })),
      },
    },
  });

  // MANAGER - Read all, manage terminals, buses, drivers
  const managerPermissions = createdPermissions.filter(p =>
    p.action === 'read' ||
    p.resource === 'Terminal' ||
    p.resource === 'Bus' ||
    p.resource === 'Driver' ||
    p.resource === 'Booking'
  );

  const managerRole = await prisma.role.create({
    data: {
      roleName: 'MANAGER',
      description: 'Operations manager',
      rolePermissions: {
        create: managerPermissions.map(p => ({
          permissionId: p.id,
        })),
      },
    },
  });

  // DRIVER - Read buses, terminals, own profile
  const driverPermissions = createdPermissions.filter(p =>
    (p.resource === 'Bus' && p.action === 'read') ||
    (p.resource === 'Terminal' && p.action === 'read') ||
    (p.resource === 'Driver' && p.action === 'read')
  );

  const driverRole = await prisma.role.create({
    data: {
      roleName: 'DRIVER',
      description: 'Bus driver',
      rolePermissions: {
        create: driverPermissions.map(p => ({
          permissionId: p.id,
        })),
      },
    },
  });

  // PASSENGER - Read public info, manage own bookings
  const passengerPermissions = createdPermissions.filter(p =>
    (p.resource === 'Booking') ||
    (p.resource === 'Terminal' && p.action === 'read') ||
    (p.resource === 'Bus' && p.action === 'read')
  );

  const passengerRole = await prisma.role.create({
    data: {
      roleName: 'PASSENGER',
      description: 'Regular passenger',
      rolePermissions: {
        create: passengerPermissions.map(p => ({
          permissionId: p.id,
        })),
      },
    },
  });

  console.log('✅ Created 5 roles');

  console.log('👤 Creating seed users...');

  // Hash passwords
  const hashedPassword = await bcrypt.hash('Password123!', 10);

  // Super Admin user
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@sbts.com',
      fullName: 'Super Admin',
      phone: '+1234567890',
      passwordHash: hashedPassword,
      userRoles: {
        create: {
          roleId: superAdminRole.id,
        },
      },
    },
  });

  // Admin user
  const admin = await prisma.user.create({
    data: {
      email: 'admin@sbts.com',
      fullName: 'Admin User',
      phone: '+1234567891',
      passwordHash: hashedPassword,
      userRoles: {
        create: {
          roleId: adminRole.id,
        },
      },
    },
  });

  // Manager user
  const manager = await prisma.user.create({
    data: {
      email: 'manager@sbts.com',
      fullName: 'Manager User',
      phone: '+1234567892',
      passwordHash: hashedPassword,
      userRoles: {
        create: {
          roleId: managerRole.id,
        },
      },
    },
  });

  // Driver user
  const driver = await prisma.user.create({
    data: {
      email: 'driver@sbts.com',
      fullName: 'Driver User',
      phone: '+1234567893',
      passwordHash: hashedPassword,
      userRoles: {
        create: {
          roleId: driverRole.id,
        },
      },
    },
  });

  // Passenger user
  const passenger = await prisma.user.create({
    data: {
      email: 'passenger@sbts.com',
      fullName: 'Passenger User',
      phone: '+1234567894',
      passwordHash: hashedPassword,
      userRoles: {
        create: {
          roleId: passengerRole.id,
        },
      },
    },
  });

  console.log('✅ Created 5 seed users');

  console.log('✅ Database seeded successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - ${createdPermissions.length} permissions`);
  console.log('   - 5 roles');
  console.log('   - 5 users');
  console.log('\n🔐 Test credentials (password: Password123!):');
  console.log('   - superadmin@sbts.com (SUPER_ADMIN)');
  console.log('   - admin@sbts.com (ADMIN)');
  console.log('   - manager@sbts.com (MANAGER)');
  console.log('   - driver@sbts.com (DRIVER)');
  console.log('   - passenger@sbts.com (PASSENGER)');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });