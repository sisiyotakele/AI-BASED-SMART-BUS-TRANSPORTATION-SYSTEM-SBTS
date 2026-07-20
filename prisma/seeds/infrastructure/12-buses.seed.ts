// ================================================================
// INFRASTRUCTURE SEED: Buses
// ================================================================
// Purpose: Create bus fleet with route assignments
// Dependency: 05-terminals.seed.ts, 07-routes.seed.ts
// Tables: Bus, BusRouteAssignment
// ================================================================

import { PrismaClient, FuelType } from '@prisma/client';

const BUS_MODELS: Array<{ manufacturer: string; model: string; capacity: number; standing: number; fuel: FuelType }> = [
  { manufacturer: 'Yutong', model: 'ZK6128H', capacity: 70, standing: 30, fuel: FuelType.DIESEL },
  { manufacturer: 'Yutong', model: 'ZK6108H', capacity: 60, standing: 25, fuel: 'DIESEL' },
  { manufacturer: 'Isuzu', model: 'NQR 71P', capacity: 50, standing: 20, fuel: 'DIESEL' },
  { manufacturer: 'BYD', model: 'K9', capacity: 80, standing: 35, fuel: 'ELECTRIC' },
  { manufacturer: 'Scania', model: 'Citywide LE', capacity: 65, standing: 28, fuel: 'DIESEL' },
];

const TERMINAL_CODES = ['TERM-BOLE', 'TERM-MEG', 'TERM-PIA', 'TERM-MER', 'TERM-CMC', 'TERM-KAL'];
const BUS_COLORS = ['White/Blue', 'White/Green', 'White/Red', 'White/Silver', 'White/Yellow'];

const usedPlates = new Set<string>();
function generatePlate(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let plate: string;
  do {
    const l1 = letters[Math.floor(Math.random() * letters.length)];
    const l2 = letters[Math.floor(Math.random() * letters.length)];
    const l3 = letters[Math.floor(Math.random() * letters.length)];
    const nums = String(Math.floor(Math.random() * 100000)).padStart(5, '0');
    plate = `${l1}${l2}${l3}-${nums}`;
  } while (usedPlates.has(plate));
  usedPlates.add(plate);
  return plate;
}

// FIX: the previous VIN generator (`Math.random().toString().substring(2,13)`)
// produces a variable-length string — Math.random() doesn't always yield
// 11+ digits after the decimal point, so this occasionally generated
// short VINs that could collide against the @unique constraint on
// Bus.vin_number. Fixed with a fixed-width, index-seeded generator.
function generateVin(index: number): string {
  const randomPart = Math.floor(Math.random() * 1_000_000_000)
    .toString()
    .padStart(9, '0');
  return `VIN${String(index).padStart(3, '0')}${randomPart}`;
}

export async function seedBuses(prisma: PrismaClient) {
  console.log('🚌 Creating Buses...');

  const terminals = await prisma.terminal.findMany();
  const routes = await prisma.route.findMany();

  const terminalMap = Object.fromEntries(terminals.map(t => [t.terminal_code, t.id]));
  const routeMap = Object.fromEntries(routes.map(r => [r.route_code, r.id]));

  const busCount = parseInt(process.env.SEED_BUSES_COUNT || '25', 10);
  let busCreated = 0;
  let assignmentCreated = 0;

  for (let i = 0; i < busCount; i++) {
    const model = BUS_MODELS[i % BUS_MODELS.length];
    const terminalCode = TERMINAL_CODES[i % TERMINAL_CODES.length];
    const color = BUS_COLORS[i % BUS_COLORS.length];
    const year = 2020 + Math.floor(Math.random() * 5);

    const plate = generatePlate();
    const fleet = `SHG-${String(i + 1).padStart(3, '0')}`;

    try {
      const bus = await prisma.bus.create({
        data: {
          plate_number: plate,
          fleet_number: fleet,
          vin_number: generateVin(i),
          terminal_id: terminalMap[terminalCode],
          manufacturer: model.manufacturer,
          model: model.model,
          manufacture_year: year,
          color: color,
          capacity: model.capacity,
          standing_capacity: model.standing,
          fuel_type: model.fuel,
          status: Math.random() > 0.1 ? 'ACTIVE' : 'IN_MAINTENANCE',
          registration_date: new Date(year, 1, 1),
          insurance_expiry: new Date(year + 1, 1, 1),
          inspection_expiry: new Date(year + 1, 6, 1),
          gps_device_id: `GPS-${String(i + 1).padStart(3, '0')}`,
          odometer_km: Math.floor(Math.random() * 50000),
          last_service_date: new Date(2024, 1, 1),
          next_service_date: new Date(2024, 7, 1),
          total_trips: Math.floor(Math.random() * 500),
          notes: `${model.manufacturer} ${model.model}`,
        },
      });

      busCreated++;

      // Assign bus to a random route
      const routeCodes = Object.keys(routeMap);
      const assignedRoute = routeCodes[Math.floor(Math.random() * routeCodes.length)];
      if (assignedRoute) {
        await prisma.busRouteAssignment.create({
          data: {
            bus_id: bus.id,
            route_id: routeMap[assignedRoute],
            assigned_date: new Date('2024-01-01'),
            end_date: null,
            is_active: true,
          },
        });
        assignmentCreated++;
      }
    } catch (error) {
      console.warn(`   ⚠️ Could not create bus ${fleet}: ${error}`);
    }
  }

  console.log(`✅ ${busCreated} buses created`);
  console.log(`✅ ${assignmentCreated} bus route assignments created`);
}