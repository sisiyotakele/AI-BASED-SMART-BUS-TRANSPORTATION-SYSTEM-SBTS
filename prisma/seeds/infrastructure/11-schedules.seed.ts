// ================================================================
// INFRASTRUCTURE SEED: Schedules
// ================================================================
// Purpose: Create peak/off-peak schedules for all routes
// Dependency: 08-route-versions.seed.ts
// Tables: Schedule
// ================================================================

import { PrismaClient } from '@prisma/client';

const ROUTE_DURATIONS: Record<string, number> = {
  'R-101': 45, 'R-102': 40, 'R-103': 35, 'R-104': 10,
  'R-105': 25, 'R-106': 38, 'R-107': 50, 'R-108': 42,
  'R-109': 30, 'R-110': 35, 'R-111': 28, 'R-112': 32,
};

const DAY_CONFIGS = [
  { days: 'MON,TUE,WED,THU,FRI', isPeak: true, interval: 20, start: 6, end: 20 },
  { days: 'SAT,SUN', isPeak: false, interval: 30, start: 7, end: 19 },
];

export async function seedSchedules(prisma: PrismaClient) {
  console.log('📅 Creating Schedules...');

  const routes = await prisma.route.findMany();
  const versions = await prisma.routeVersion.findMany();

  const versionMap = Object.fromEntries(versions.map(v => {
    const route = routes.find(r => r.id === v.route_id);
    return [route?.route_code, v.id];
  }).filter(([key]) => key !== undefined));

  const routeMap = Object.fromEntries(routes.map(r => [r.route_code, r.id]));

  let totalCreated = 0;

  for (const route of routes) {
    const routeCode = route.route_code;
    const versionId = versionMap[routeCode];
    const duration = ROUTE_DURATIONS[routeCode] || 30;

    if (!versionId) continue;

    for (const day of DAY_CONFIGS) {
      let hour = day.start;
      let minute = 0;

      while (hour < day.end) {
        const depTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
        const arrHour = hour + Math.floor(duration / 60);
        const arrMinute = minute + (duration % 60);
        const arrTime = `${String(arrHour).padStart(2, '0')}:${String(arrMinute).padStart(2, '0')}:00`;

        try {
          await prisma.schedule.create({
            data: {
              route_id: route.id,
              version_id: versionId,
              schedule_name: `${day.isPeak ? 'Weekday' : 'Weekend'} - ${routeCode}`,
              description: `Regular ${day.isPeak ? 'weekday' : 'weekend'} service`,
              departure_time: depTime,
              arrival_time: arrTime,
              frequency_minutes: day.interval,
              operating_days: day.days,
              is_peak: day.isPeak,
              priority: day.isPeak ? 1 : 2,
              effective_from: new Date('2024-01-01'),
              effective_to: null,
              status: 'ACTIVE',
            },
          });
          totalCreated++;
        } catch (error) {
          // Skip duplicate
        }

        minute += day.interval;
        if (minute >= 60) {
          hour += Math.floor(minute / 60);
          minute = minute % 60;
        }
      }
    }
  }

  console.log(`✅ ${totalCreated} schedules created`);
}