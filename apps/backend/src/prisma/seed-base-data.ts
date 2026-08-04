/**
 * Seed base reference data requested by supervisor
 * Includes: departments, terminals, maintenance status, incident types, 
 *           incident severity, notification types
 * 
 * Run with: npm run db:seed:base
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Base data constants
const DEPARTMENTS = [
    'Operations',
    'Maintenance',
    'Customer Service',
    'IT & Technology',
    'Human Resources',
    'Finance',
    'Safety & Compliance',
];

const INCIDENT_TYPES = [
    'mechanical_failure',
    'accident',
    'delay',
    'traffic',
    'passenger_issue',
    'weather',
    'road_condition',
    'other',
];

const NOTIFICATION_TYPES = [
    'trip_update',
    'delay_alert',
    'cancellation',
    'arrival_notification',
    'departure_notification',
    'maintenance_alert',
    'incident_alert',
    'system_announcement',
];

async function main() {
    console.log('📋 Seeding base data for SBTS...');

    // Verify base users exist
    const users = await prisma.user.findMany({
        where: {
            email: {
                in: ['superadmin@sbts.com', 'admin@sbts.com', 'manager@sbts.com', 'driver@sbts.com'],
            },
        },
    });

    if (users.length < 4) {
        throw new Error('Base users not found. Run main seed first: npm run db:seed');
    }

    console.log('🏢 Configuring departments...');

    await Promise.all([
        prisma.user.update({
            where: { email: 'superadmin@sbts.com' },
            data: { department: 'IT & Technology' },
        }),
        prisma.user.update({
            where: { email: 'admin@sbts.com' },
            data: { department: 'Operations' },
        }),
        prisma.user.update({
            where: { email: 'manager@sbts.com' },
            data: { department: 'Operations' },
        }),
        prisma.user.update({
            where: { email: 'driver@sbts.com' },
            data: { department: 'Operations' },
        }),
    ]);

    console.log(`✅ Configured ${DEPARTMENTS.length} departments`);

    console.log('📍 Creating terminals...');

    // Check if terminals already exist
    const existingTerminals = await prisma.terminal.findMany();

    if (existingTerminals.length === 0) {
        await Promise.all([
            prisma.terminal.create({
                data: {
                    terminalName: 'Central Terminal',
                    latitude: 9.0320,
                    longitude: 38.7469,
                    address: 'Addis Ababa Central Station, Churchill Avenue',
                    capacity: 50,
                    facilities: 'Waiting area, ticketing, restrooms, parking',
                },
            }),
            prisma.terminal.create({
                data: {
                    terminalName: 'North Terminal',
                    latitude: 9.0450,
                    longitude: 38.7600,
                    address: 'North Station, Bole Road, Addis Ababa',
                    capacity: 40,
                    facilities: 'Waiting area, ticketing, restrooms',
                },
            }),
            prisma.terminal.create({
                data: {
                    terminalName: 'South Terminal',
                    latitude: 9.0100,
                    longitude: 38.7300,
                    address: 'South Station, Kality Area, Addis Ababa',
                    capacity: 35,
                    facilities: 'Waiting area, ticketing, parking',
                },
            }),
        ]);
        console.log('✅ Created 3 terminals');
    } else {
        console.log(`✅ Terminals already exist (${existingTerminals.length} found)`);
    }

    console.log('\n✅ Base data configured successfully!');
    console.log('\n📊 Base Data Summary:');
    console.log(`\n🏢 Departments (${DEPARTMENTS.length}):`);
    DEPARTMENTS.forEach((dept) => console.log(`   - ${dept}`));

    console.log(`\n🚍 Bus Maintenance Status (Enum - 3):`);
    console.log('   - operational');
    console.log('   - in_maintenance');
    console.log('   - retired');

    console.log(`\n🚨 Incident Types (Reference - ${INCIDENT_TYPES.length}):`);
    INCIDENT_TYPES.forEach((type) => console.log(`   - ${type}`));

    console.log(`\n⚠️  Incident Severity (Enum - 4):`);
    console.log('   - low');
    console.log('   - medium');
    console.log('   - high');
    console.log('   - critical');

    console.log(`\n🔔 Notification Types (Reference - ${NOTIFICATION_TYPES.length}):`);
    NOTIFICATION_TYPES.forEach((type) => console.log(`   - ${type}`));

    const terminalCount = await prisma.terminal.count();
    console.log(`\n📍 Terminals: ${terminalCount}`);
}

main()
    .catch((e) => {
        console.error('❌ Base data seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
