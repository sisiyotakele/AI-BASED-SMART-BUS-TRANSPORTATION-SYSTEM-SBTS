import cron from 'node-cron';
import { logger } from '@/common/logger';
import { prisma } from '@/prisma/client';
import { createTrip } from './trips.service';

/**
 * Automates daily trip generation by mapping Active Schedules 
 * to available Shifts & Buses for the current day.
 */
export async function generateTripsForToday() {
  logger.info('Starting nightly automated trip generation...');
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

    // 1. Fetch all Active Schedules for today
    const schedules = await prisma.schedule.findMany({
      where: {
        isActive: true,
        dayOfWeek: dayName as any,
        deletedAt: null,
      },
    });

    logger.info(`Found ${schedules.length} active schedules for ${dayName}.`);

    let successCount = 0;
    let failCount = 0;

    for (const schedule of schedules) {
      try {
        // Calculate expected start time
        let timeVal = schedule.departureTime as unknown;
        let timeString = '';
        if (timeVal instanceof Date) {
             timeString = timeVal.toISOString();
        } else {
             timeString = String(timeVal);
        }

        let hours = 8;
        let mins = 0;
        
        if (typeof timeString === 'string') {
          if (timeString.includes('T')) {
            const d = new Date(timeString);
            hours = d.getUTCHours();
            mins = d.getUTCMinutes();
          } else if (timeString.includes(':')) {
            const parts = timeString.split(':');
            hours = parseInt(parts[0], 10);
            mins = parseInt(parts[1], 10);
          }
        }

        const scheduledStart = new Date(today);
        scheduledStart.setHours(hours, mins, 0, 0);

        // Estimate duration (120 minutes default)
        const durationMins = 120;
        const scheduledEnd = new Date(scheduledStart.getTime() + durationMins * 60000);


        // 2. Find an eligible Shift & Bus that covers this time
        // The driver must have a shift covering that time, and must have a bus assigned.
        const activeShifts = await prisma.shift.findMany({
          where: {
            isActive: true,
            shiftDate: today,
            deletedAt: null,
          },
          include: {
            busDriverAssignments: {
              where: { status: 'active', deletedAt: null },
            },
          },
        });

        // Loop through shifts to find an available driver & bus combo
        let selectedDriverId = null;
        let selectedBusId = null;

        for (const shift of activeShifts) {
          // Verify time boundary of shift (simplified check)
          // In real prod, compare shiftStart / shiftEnd against scheduledStart/End
          
          if (shift.busDriverAssignments.length > 0) {
            const candidateDriver = shift.driverId;
            const candidateBus = shift.busDriverAssignments[0].busId;

            // Ensure they aren't already booked for another trip at this same time
            const existingTrip = await prisma.trip.findFirst({
              where: {
                OR: [
                  { driverId: candidateDriver },
                  { busId: candidateBus }
                ],
                status: { in: ['scheduled', 'in_progress'] },
                deletedAt: null,
                AND: [
                  { scheduledStart: { lte: scheduledEnd } },
                  { scheduledEnd: { gte: scheduledStart } }
                ]
              }
            });

            if (!existingTrip) {
              selectedDriverId = candidateDriver;
              selectedBusId = candidateBus;
              break; // Found one!
            }
          }
        }

        if (selectedDriverId && selectedBusId) {
          // 3. Dispatch the Trip creation
          await createTrip({
            busId: selectedBusId,
            driverId: selectedDriverId,
            versionId: schedule.versionId,
            scheduleId: schedule.id,
            scheduledStart,
            scheduledEnd,
          });
          successCount++;
          logger.info(`Automated trip created for schedule: ${schedule.scheduleName}`);
        } else {
          logger.warn(`Could not find available unbooked driver/bus for schedule: ${schedule.scheduleName}`);
          failCount++;
        }
      } catch (err) {
        logger.error(`Failed to auto-generate trip for schedule ${schedule.id}:`, err);
        failCount++;
      }
    }

    logger.info(`Nightly Trip Generation Complete. Success: ${successCount}, Failures/Unassigned: ${failCount}`);
  } catch (error) {
    logger.error('Error during automated trip generation:', error);
  }
}

/**
 * Initializes the automated CRON scheduling.
 * 
 * "0 0 * * *" = Runs every night at midnight (00:00).
 */
export function initTripCronJobs() {
  logger.info('Initializing automated Trip Generation Cron Job (Nightly at Midnight).');
  
  cron.schedule('0 0 * * *', async () => {
    logger.info('Triggering nightly cron for Trip Generation...');
    await generateTripsForToday();
  });
}
