import { prisma } from '@/prisma/client';
import { logger } from '@/common/logger';
import { TripStatus } from '@prisma/client';

export async function generateTripsForDate(dateString: string) {
    // 1. Get Date Context
    const targetDate = new Date(dateString);
    if (isNaN(targetDate.getTime())) {
        throw new Error("Invalid date provided.");
    }
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = days[targetDate.getDay()] as any;

    const result = { created: 0, skipped: 0, failed: 0, errors: [] as string[] };

    // 2. Fetch active Schedules for the day
    const schedules = await prisma.schedule.findMany({
        where: {
            dayOfWeek: dayName,
            isActive: true,
            deletedAt: null,
            OR: [
                { effectiveFrom: null },
                { effectiveFrom: { lte: targetDate } }
            ]
        },
        include: { route: true }
    });

    // Group schedules by routeId
    const schedulesByRoute = new Map<string, typeof schedules>();
    for (const schedule of schedules) {
        if (schedule.effectiveUntil && schedule.effectiveUntil < targetDate) {
            continue;
        }
        const routeArr = schedulesByRoute.get(schedule.routeId) || [];
        routeArr.push(schedule);
        schedulesByRoute.set(schedule.routeId, routeArr);
    }

    // 3. For each route, find allocated buses and round-robin distribute schedules
    for (const [routeId, routeSchedules] of schedulesByRoute.entries()) {
        
        // Find Buses assigned to this route on this date
        const busRouteAssignments = await prisma.busRouteAssignment.findMany({
            where: {
                routeId: routeId,
                isActive: true,
                deletedAt: null,
                assignedDate: { lte: targetDate },
                OR: [
                    { endDate: null },
                    { endDate: { gte: targetDate } }
                ]
            },
            include: { bus: true }
        });

        if (busRouteAssignments.length === 0) {
            result.errors.push(`No active BusRouteAssignments for route ${routeSchedules[0]?.route?.routeName || routeId} on ${dateString}`);
            result.failed += routeSchedules.length;
            continue;
        }

        // We have buses. Sort them by ID for consistency.
        const activeBuses = busRouteAssignments.map(a => a.busId).sort();
        
        // Sort schedules by time
        routeSchedules.sort((a,b) => {
            const timeA = new Date(a.departureTime).getTime();
            const timeB = new Date(b.departureTime).getTime();
            return timeA - timeB;
        });

        let nextBusIdx = 0;
        
        for (const schedule of routeSchedules) {
            const assignedBusId = activeBuses[nextBusIdx];
            nextBusIdx = (nextBusIdx + 1) % activeBuses.length;

            // Find Drive working this Bus via BusDriverAssignment for targetDate
            // Note: Date in DB might be midnight. Use strict matching or lte/gte range bounds.
            const dateStart = new Date(targetDate);
            dateStart.setHours(0,0,0,0);
            const dateEnd = new Date(targetDate);
            dateEnd.setHours(23,59,59,999);

            const driverAssign = await prisma.busDriverAssignment.findFirst({
                where: {
                    busId: assignedBusId,
                    status: 'active',
                    deletedAt: null,
                    assignedDate: {
                        gte: dateStart,
                        lte: dateEnd
                    }
                },
                include: { shift: true }
            });

            if (!driverAssign) {
                result.errors.push(`Bus ${assignedBusId} is assigned to Route ${routeId} but has NO Driver assigned to it for date ${dateString}. Cannot generate trip for schedule ${schedule.scheduleName}.`);
                result.failed++;
                continue;
            }

            // Verify shift times cover scheduled departure (Optional strict rule, but good practice)
            const scheduledStart = new Date(targetDate);
            scheduledStart.setHours(schedule.departureTime.getHours(), schedule.departureTime.getMinutes(), 0, 0);
            const scheduledEnd = new Date(scheduledStart.getTime() + 120 * 60000); // Default 2 hr trip

            // Check if this Trip already exists
            const existingTrip = await prisma.trip.findFirst({
                where: {
                    scheduleId: schedule.id,
                    scheduledStart: scheduledStart,
                    deletedAt: null
                }
            });

            if (existingTrip) {
                result.skipped++;
                continue; // Trip already generated
            }

            // Database Exclusion Constraints handle overlap! We can safely insert inside a try/catch.
            try {
                await prisma.trip.create({
                    data: {
                        busId: assignedBusId,
                        driverId: driverAssign.shift.driverId,
                        versionId: schedule.versionId,
                        scheduleId: schedule.id,
                        scheduledStart,
                        scheduledEnd,
                        status: TripStatus.scheduled,
                        estimatedDurationMinutes: 120
                    }
                });
                result.created++;
            } catch (error: any) {
                result.errors.push(`Failed to create Trip for schedule ${schedule.scheduleName}: overlapping allocation or database constraint. Error: ${error.message}`);
                result.failed++;
            }
        }
    }

    return result;
}
