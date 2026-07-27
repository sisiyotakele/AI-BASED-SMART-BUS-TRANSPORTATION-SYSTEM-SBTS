import { prismaTest as prisma } from '@/common/test-utils/test-db';
import * as scheduleService from '../schedules.service';
import { NotFoundError } from '@/common/errors';
import { createUser } from '@/common/test-utils/factories';
import { resetDatabase } from '@/common/test-utils/test-db';

describe('Schedules Service', () => {
    let adminUser: any;
    let route: any;
    let version: any;

    beforeEach(async () => {
        await resetDatabase();

        adminUser = await createUser({ email: `admin-schedules-${Date.now()}@test.com` });

        // Create stops first
        const startStop = await prisma.stop.create({
            data: { stopName: 'Start Stop', stopCode: `START-${Date.now()}` },
        });

        const endStop = await prisma.stop.create({
            data: { stopName: 'End Stop', stopCode: `END-${Date.now()}` },
        });

        // Create route with required fields
        route = await prisma.route.create({
            data: {
                routeName: 'Test Route',
                startStopId: startStop.id,
                endStopId: endStop.id,
            },
        });

        // Create route version with correct fields
        version = await prisma.routeVersion.create({
            data: {
                routeId: route.id,
                versionNumber: 1,
                isActive: true,
            },
        });
    });

    describe('createSchedule', () => {
        it('should create a schedule with valid data', async () => {
            const scheduleData = {
                routeId: route.id,
                versionId: version.id,
                scheduleName: 'Morning Schedule',
                dayOfWeek: 'monday',
                departureTime: '06:00',
                frequencyMinutes: 30,
                isActive: true,
                effectiveFrom: new Date('2026-08-01'),
            };

            const schedule = await scheduleService.createSchedule(scheduleData, adminUser.id);

            expect(schedule).toBeDefined();
            expect(schedule.scheduleName).toBe('Morning Schedule');
            expect(schedule.dayOfWeek).toBe('monday');
            expect(schedule.departureTime).toBeInstanceOf(Date);
            expect(schedule.departureTime.getHours()).toBe(6);
            expect(schedule.departureTime.getMinutes()).toBe(0);
            expect(schedule.frequencyMinutes).toBe(30);
            expect(schedule.isActive).toBe(true);
        });

        it('should create a schedule with minimal data', async () => {
            const scheduleData = {
                routeId: route.id,
                versionId: version.id,
                scheduleName: 'Basic Schedule',
                dayOfWeek: 'tuesday',
                departureTime: '08:00',
            };

            const schedule = await scheduleService.createSchedule(scheduleData, adminUser.id);

            expect(schedule).toBeDefined();
            expect(schedule.scheduleName).toBe('Basic Schedule');
            expect(schedule.frequencyMinutes).toBeNull();
            expect(schedule.effectiveFrom).toBeNull();
        });

        it('should create schedules for different days of week', async () => {
            const monday = await scheduleService.createSchedule({
                routeId: route.id,
                versionId: version.id,
                scheduleName: 'Monday Schedule',
                dayOfWeek: 'monday',
                departureTime: '07:00',
            }, adminUser.id);

            const friday = await scheduleService.createSchedule({
                routeId: route.id,
                versionId: version.id,
                scheduleName: 'Friday Schedule',
                dayOfWeek: 'friday',
                departureTime: '07:00',
            }, adminUser.id);

            expect(monday.dayOfWeek).toBe('monday');
            expect(friday.dayOfWeek).toBe('friday');
        });

        it('should handle time parsing correctly', async () => {
            const schedule = await scheduleService.createSchedule({
                routeId: route.id,
                versionId: version.id,
                scheduleName: 'Time Test',
                dayOfWeek: 'wednesday',
                departureTime: '14:30',
            }, adminUser.id);

            expect(schedule.departureTime.getHours()).toBe(14);
            expect(schedule.departureTime.getMinutes()).toBe(30);
        });
    });

    describe('listSchedules', () => {
        beforeEach(async () => {
            await scheduleService.createSchedule({
                routeId: route.id,
                versionId: version.id,
                scheduleName: 'Schedule 1',
                dayOfWeek: 'monday',
                departureTime: '06:00',
            }, adminUser.id);

            await scheduleService.createSchedule({
                routeId: route.id,
                versionId: version.id,
                scheduleName: 'Schedule 2',
                dayOfWeek: 'monday',
                departureTime: '08:00',
            }, adminUser.id);

            await scheduleService.createSchedule({
                routeId: route.id,
                versionId: version.id,
                scheduleName: 'Schedule 3',
                dayOfWeek: 'friday',
                departureTime: '07:00',
            }, adminUser.id);
        });

        it('should list all schedules', async () => {
            const schedules = await scheduleService.listSchedules();

            expect(schedules).toHaveLength(3);
            expect(schedules[0].route).toBeDefined();
            expect(schedules[0].version).toBeDefined();
        });

        it('should list schedules ordered by departure time', async () => {
            const schedules = await scheduleService.listSchedules();

            expect(schedules[0].departureTime.getHours()).toBe(6);
            expect(schedules[1].departureTime.getHours()).toBe(7);
            expect(schedules[2].departureTime.getHours()).toBe(8);
        });

        it('should filter schedules by route', async () => {
            const schedules = await scheduleService.listSchedules({ routeId: route.id });

            expect(schedules).toHaveLength(3);
            expect(schedules.every(s => s.routeId === route.id)).toBe(true);
        });

        it('should filter schedules by day of week', async () => {
            const schedules = await scheduleService.listSchedules({ dayOfWeek: 'monday' });

            expect(schedules).toHaveLength(2);
            expect(schedules.every(s => s.dayOfWeek === 'monday')).toBe(true);
        });

        it('should not return soft-deleted schedules', async () => {
            const schedule = await scheduleService.createSchedule({
                routeId: route.id,
                versionId: version.id,
                scheduleName: 'To Delete',
                dayOfWeek: 'sunday',
                departureTime: '10:00',
            }, adminUser.id);

            await scheduleService.deleteSchedule(schedule.id);

            const schedules = await scheduleService.listSchedules();
            expect(schedules.find(s => s.id === schedule.id)).toBeUndefined();
        });
    });

    describe('getScheduleById', () => {
        it('should get schedule by ID', async () => {
            const created = await scheduleService.createSchedule({
                routeId: route.id,
                versionId: version.id,
                scheduleName: 'Test Schedule',
                dayOfWeek: 'thursday',
                departureTime: '09:00',
            }, adminUser.id);

            const schedule = await scheduleService.getScheduleById(created.id);

            expect(schedule).toBeDefined();
            expect(schedule.id).toBe(created.id);
            expect(schedule.scheduleName).toBe('Test Schedule');
            expect(schedule.route).toBeDefined();
            expect(schedule.version).toBeDefined();
        });

        it('should throw NotFoundError for non-existent schedule', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                scheduleService.getScheduleById(fakeId)
            ).rejects.toThrow(NotFoundError);
        });

        it('should throw NotFoundError for soft-deleted schedule', async () => {
            const schedule = await scheduleService.createSchedule({
                routeId: route.id,
                versionId: version.id,
                scheduleName: 'To Delete',
                dayOfWeek: 'saturday',
                departureTime: '10:00',
            }, adminUser.id);

            await scheduleService.deleteSchedule(schedule.id);

            await expect(
                scheduleService.getScheduleById(schedule.id)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('updateSchedule', () => {
        it('should update schedule fields', async () => {
            const schedule = await scheduleService.createSchedule({
                routeId: route.id,
                versionId: version.id,
                scheduleName: 'Original Name',
                dayOfWeek: 'monday',
                departureTime: '08:00',
                frequencyMinutes: 30,
                isActive: true,
            }, adminUser.id);

            const updated = await scheduleService.updateSchedule(schedule.id, {
                scheduleName: 'Updated Name',
                frequencyMinutes: 45,
                isActive: false,
            });

            expect(updated.scheduleName).toBe('Updated Name');
            expect(updated.frequencyMinutes).toBe(45);
            expect(updated.isActive).toBe(false);
            expect(updated.dayOfWeek).toBe('monday'); // Unchanged
        });

        it('should update departure time', async () => {
            const schedule = await scheduleService.createSchedule({
                routeId: route.id,
                versionId: version.id,
                scheduleName: 'Time Update Test',
                dayOfWeek: 'tuesday',
                departureTime: '08:00',
            }, adminUser.id);

            const updated = await scheduleService.updateSchedule(schedule.id, {
                departureTime: '10:30',
            });

            expect(updated.departureTime.getHours()).toBe(10);
            expect(updated.departureTime.getMinutes()).toBe(30);
        });

        it('should update day of week', async () => {
            const schedule = await scheduleService.createSchedule({
                routeId: route.id,
                versionId: version.id,
                scheduleName: 'Day Update Test',
                dayOfWeek: 'monday',
                departureTime: '08:00',
            }, adminUser.id);

            const updated = await scheduleService.updateSchedule(schedule.id, {
                dayOfWeek: 'friday',
            });

            expect(updated.dayOfWeek).toBe('friday');
        });

        it('should throw NotFoundError when updating non-existent schedule', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                scheduleService.updateSchedule(fakeId, { scheduleName: 'Updated' })
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('deleteSchedule', () => {
        it('should soft-delete a schedule', async () => {
            const schedule = await scheduleService.createSchedule({
                routeId: route.id,
                versionId: version.id,
                scheduleName: 'To Delete',
                dayOfWeek: 'sunday',
                departureTime: '12:00',
            }, adminUser.id);

            const deleted = await scheduleService.deleteSchedule(schedule.id);

            expect(deleted.deletedAt).not.toBeNull();
            expect(deleted.deletedAt).toBeInstanceOf(Date);

            const schedules = await scheduleService.listSchedules();
            expect(schedules.find(s => s.id === schedule.id)).toBeUndefined();
        });

        it('should throw NotFoundError when deleting non-existent schedule', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                scheduleService.deleteSchedule(fakeId)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('Edge Cases', () => {
        it('should handle early morning times (00:00)', async () => {
            const schedule = await scheduleService.createSchedule({
                routeId: route.id,
                versionId: version.id,
                scheduleName: 'Midnight Schedule',
                dayOfWeek: 'saturday',
                departureTime: '00:00',
            }, adminUser.id);

            expect(schedule.departureTime.getHours()).toBe(0);
            expect(schedule.departureTime.getMinutes()).toBe(0);
        });

        it('should handle late evening times (23:59)', async () => {
            const schedule = await scheduleService.createSchedule({
                routeId: route.id,
                versionId: version.id,
                scheduleName: 'Late Night Schedule',
                dayOfWeek: 'saturday',
                departureTime: '23:59',
            }, adminUser.id);

            expect(schedule.departureTime.getHours()).toBe(23);
            expect(schedule.departureTime.getMinutes()).toBe(59);
        });

        it('should handle effectiveFrom and effectiveUntil dates', async () => {
            const schedule = await scheduleService.createSchedule({
                routeId: route.id,
                versionId: version.id,
                scheduleName: 'Seasonal Schedule',
                dayOfWeek: 'monday',
                departureTime: '08:00',
                effectiveFrom: new Date('2026-08-01'),
                effectiveUntil: new Date('2026-12-31'),
            }, adminUser.id);

            expect(schedule.effectiveFrom).toBeInstanceOf(Date);
            expect(schedule.effectiveUntil).toBeInstanceOf(Date);
        });
    });
});
