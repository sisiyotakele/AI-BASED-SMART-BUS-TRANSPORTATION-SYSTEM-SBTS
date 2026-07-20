// ================================================================
// INFRASTRUCTURE SEED: Terminals
// ================================================================
// Purpose: Create bus terminals based on Addis Ababa locations
// Tables: Terminal
//
// COORDINATES VERIFIED against Google Places (July 2026). The
// original coordinates here were off by as much as ~8 km for some
// terminals (Megenagna and CMC in particular were placed several
// kilometers from their real locations). Fixed below; 06-stops.seed.ts
// has the matching corrections for the stops that reuse these points.
// ================================================================

import { PrismaClient } from '@prisma/client';

const TERMINALS = [
  {
    code: 'TERM-BOLE',
    name: 'Bole Terminal',
    address: 'Bole Road, Near Bole International Airport, Addis Ababa',
    latitude: 8.9838,
    longitude: 38.7963,
    phone: '+251900000001',
    email: 'bole@shegerbus.et',
    capacity: 45,
    facilities: 'Parking, Restrooms, Cafe, Ticket Office, Waiting Lounge, Wi-Fi',
    hours: '5:30 AM - 10:00 PM',
  },
  {
    code: 'TERM-MEG',
    name: 'Megenagna Terminal',
    address: 'Megenagna, Addis Ababa',
    latitude: 9.0198,
    longitude: 38.8018,
    phone: '+251900000002',
    email: 'megenagna@shegerbus.et',
    capacity: 35,
    facilities: 'Parking, Restrooms, Ticket Office, Waiting Area',
    hours: '5:30 AM - 9:30 PM',
  },
  {
    code: 'TERM-PIA',
    name: 'Piassa Terminal',
    address: 'Piassa, Addis Ababa',
    latitude: 9.0372,
    longitude: 38.7551,
    phone: '+251900000003',
    email: 'piassa@shegerbus.et',
    capacity: 25,
    facilities: 'Parking, Restrooms, Cafe, Ticket Office',
    hours: '6:00 AM - 9:00 PM',
  },
  {
    code: 'TERM-MER',
    name: 'Merkato Terminal',
    address: 'Merkato, Addis Ababa',
    latitude: 9.033,
    longitude: 38.7379,
    phone: '+251900000004',
    email: 'merkato@shegerbus.et',
    capacity: 40,
    facilities: 'Parking, Restrooms, Ticket Office, Market Access, Security',
    hours: '5:30 AM - 10:00 PM',
  },
  {
    code: 'TERM-CMC',
    name: 'CMC Interchange',
    address: 'CMC, Addis Ababa',
    latitude: 9.0255,
    longitude: 38.8544,
    phone: '+251900000005',
    email: 'cmc@shegerbus.et',
    capacity: 30,
    facilities: 'Parking, Restrooms, Ticket Office',
    hours: '6:00 AM - 8:30 PM',
  },
  {
    code: 'TERM-KAL',
    name: 'Kality Terminal',
    address: 'Kality, Addis Ababa',
    latitude: 8.9344,
    longitude: 38.7654,
    phone: '+251900000006',
    email: 'kality@shegerbus.et',
    capacity: 28,
    facilities: 'Parking, Restrooms, Security',
    hours: '6:00 AM - 8:00 PM',
  },
];

export async function seedTerminals(prisma: PrismaClient) {
  console.log('🏢 Creating Terminals...');

  const created = [];
  for (const t of TERMINALS) {
    try {
      const result = await prisma.terminal.create({
        data: {
          terminal_code: t.code,
          terminal_name: t.name,
          address: t.address,
          latitude: t.latitude,
          longitude: t.longitude,
          contact_phone: t.phone,
          contact_email: t.email,
          capacity: t.capacity,
          facilities: t.facilities,
          operating_hours: t.hours,
          timezone: 'Africa/Addis_Ababa',
          status: 'ACTIVE',
        },
      });
      created.push(result);
    } catch (error) {
      console.warn(`   ⚠️ Could not create terminal ${t.code}: ${error}`);
    }
  }

  console.log(`✅ ${created.length} terminals created`);
  return created;
}