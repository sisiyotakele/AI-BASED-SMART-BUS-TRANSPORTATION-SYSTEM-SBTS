import { prismaTest, resetDatabase } from '@/common/test-utils/test-db';
import * as shiftService from '../shifts.service';
import { NotFoundError, ConflictError, BadRequestError } from '@/common/errors';
import { createUser } from '@/common/test-utils/factories';

describe('Shifts Service', () => {
    let driver1: any;
    let driver2: any;

    beforeEach(async () => {
        await resetDatabase();
        driver1 = await createUser({ email: `driver1_${Date.now()}@test.com`, licenseNumber: 'DL-001' });
        driver2 = await createUser({ email: `driver2_${Date.now()}@test.com`, licenseNumber: 'DL-002' });
    });

    describe('createShift', () => {
        it('should create a shift with valid data', async () => {
            const shiftData = {
                driverId: driver1.id,
                shiftName: 'Morning Shift',
                shiftStart: '06:00',
                shiftEnd: '14:00',
                shiftDate: new Date('2026-07-20'),
                isActive: true,
            };

            const shift = await shiftService.createShift(shiftData);

            expect(shift).toBeDefined();
            expect(shift.shiftName).toBe('Morning Shift');
            expect(shift.driverId).toBe(driver1.id);
            expect(shift.shiftStart).toBeInstanceOf(Date);
            expect(shift.shiftEnd).toBeInstanceOf(Date);
            expect(shift.shiftStart.getHours()).toBe(6);
            expect(shift.shiftEnd.getHours()).toBe(14);
            expect(shift.isActive).toBe(true);
        });

        it('should create multiple shifts for different drivers on same date', async () => {
            const date = new Date('2026-07-21');

            const shift1 = await shiftService.createShift({
                driverId: driver1.id,
                shiftName: 'Driver 1 Shift',
                shiftStart: '08:00',
                shiftEnd: '16:00',
                shiftDate: date,
            });

            const shift2 = await shiftService.createShift({
                driverId: driver2.id,
                shiftName: 'Driver 2 Shift',
                shiftStart: '08:00',
                shiftEnd: '16:00',
                shiftDate: date,
            });

            expect(shift1.driverId).toBe(driver1.id);
            expect(shift2.driverId).toBe(driver2.id);
        });

        it('should throw BadRequestError when shift end is before start', async () => {
            const shiftData = {
                driverId: driver1.id,
                shiftName: 'Invalid Shift',
                shiftStart: '14:00',
                shiftEnd: '06:00', // Before start
                shiftDate: new Date('2026-07-22'),
            };

            await expect(
                shiftService.createShift(shiftData)
            ).rejects.toThrow(BadRequestError);

            await expect(
                shiftService.createShift(shiftData)
            ).rejects.toThrow('Shift end must be after shift start');
        });

        it('should throw BadRequestError when shift end equals start', async () => {
            const shiftData = {
                driverId: driver1.id,
                shiftName: 'Zero Duration',
                shiftStart: '10:00',
                shiftEnd: '10:00', // Same as start
                shiftDate: new Date('2026-07-22'),
            };

            await expect(
                shiftService.createShift(shiftData)
            ).rejects.toThrow(BadRequestError);
        });

        it('should throw ConflictError for overlapping shifts (same driver, same date)', async () => {
            const date = new Date('2026-07-23');

            await shiftService.createShift({
                driverId: driver1.id,
                shiftName: 'First Shift',
                shiftStart: '08:00',
                shiftEnd: '16:00',
                shiftDate: date,
            });

            // Overlapping shift (10:00-18:00 overlaps with 08:00-16:00)
            await expect(
                shiftService.createShift({
                    driverId: driver1.id,
                    shiftName: 'Overlapping Shift',
                    shiftStart: '10:00',
                    shiftEnd: '18:00',
                    shiftDate: date,
                })
            ).rejects.toThrow(ConflictError);

            await expect(
                shiftService.createShift({
                    driverId: driver1.id,
                    shiftName: 'Overlapping Shift',
                    shiftStart: '10:00',
                    shiftEnd: '18:00',
                    shiftDate: date,
                })
            ).rejects.toThrow('already has an overlapping shift');
        });

        it('should allow non-overlapping shifts for same driver on same date', async () => {
            const date = new Date('2026-07-24');

            const morningShift = await shiftService.createShift({
                driverId: driver1.id,
                shiftName: 'Morning',
                shiftStart: '06:00',
                shiftEnd: '12:00',
                shiftDate: date,
            });

            const eveningShift = await shiftService.createShift({
                driverId: driver1.id,
                shiftName: 'Evening',
                shiftStart: '18:00',
                shiftEnd: '22:00',
                shiftDate: date,
            });

            expect(morningShift.shiftName).toBe('Morning');
            expect(eveningShift.shiftName).toBe('Evening');
        });
    });

    describe('listShifts', () => {
        beforeEach(async () => {
            await shiftService.createShift({
                driverId: driver1.id,
                shiftName: 'Driver 1 - Day 1',
                shiftStart: '08:00',
                shiftEnd: '16:00',
                shiftDate: new Date('2026-07-25'),
            });

            await shiftService.createShift({
                driverId: driver1.id,
                shiftName: 'Driver 1 - Day 2',
                shiftStart: '08:00',
                shiftEnd: '16:00',
                shiftDate: new Date('2026-07-26'),
            });

            await shiftService.createShift({
                driverId: driver2.id,
                shiftName: 'Driver 2 - Day 1',
                shiftStart: '10:00',
                shiftEnd: '18:00',
                shiftDate: new Date('2026-07-25'),
            });
        });

        it('should list all shifts', async () => {
            const shifts = await shiftService.listShifts();

            expect(shifts).toHaveLength(3);
            expect(shifts[0].driver).toBeDefined();
            expect(shifts[0].driver.fullName).toBeDefined();
        });

        it('should filter shifts by driver', async () => {
            const shifts = await shiftService.listShifts({ driverId: driver1.id });

            expect(shifts).toHaveLength(2);
            expect(shifts.every(s => s.driverId === driver1.id)).toBe(true);
        });

        it('should filter shifts by date', async () => {
            const date = new Date('2026-07-25');
            const shifts = await shiftService.listShifts({ date });

            expect(shifts).toHaveLength(2);
            expect(shifts.every(s => s.shiftDate.toISOString().startsWith('2026-07-25'))).toBe(true);
        });

        it('should filter shifts by driver and date', async () => {
            const shifts = await shiftService.listShifts({
                driverId: driver1.id,
                date: new Date('2026-07-25'),
            });

            expect(shifts).toHaveLength(1);
            expect(shifts[0].shiftName).toBe('Driver 1 - Day 1');
        });

        it('should not return soft-deleted shifts', async () => {
            const shift = await shiftService.createShift({
                driverId: driver1.id,
                shiftName: 'To Delete',
                shiftStart: '06:00',
                shiftEnd: '14:00',
                shiftDate: new Date('2026-07-27'),
            });

            await shiftService.deleteShift(shift.id);

            const shifts = await shiftService.listShifts();
            expect(shifts.find(s => s.id === shift.id)).toBeUndefined();
        });
    });

    describe('getShiftById', () => {
        it('should get shift by ID', async () => {
            const created = await shiftService.createShift({
                driverId: driver1.id,
                shiftName: 'Test Shift',
                shiftStart: '09:00',
                shiftEnd: '17:00',
                shiftDate: new Date('2026-07-28'),
            });

            const shift = await shiftService.getShiftById(created.id);

            expect(shift).toBeDefined();
            expect(shift.id).toBe(created.id);
            expect(shift.shiftName).toBe('Test Shift');
            expect(shift.driver).toBeDefined();
        });

        it('should throw NotFoundError for non-existent shift', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                shiftService.getShiftById(fakeId)
            ).rejects.toThrow(NotFoundError);
        });

        it('should throw NotFoundError for soft-deleted shift', async () => {
            const shift = await shiftService.createShift({
                driverId: driver1.id,
                shiftName: 'To Delete',
                shiftStart: '08:00',
                shiftEnd: '16:00',
                shiftDate: new Date('2026-07-29'),
            });

            await shiftService.deleteShift(shift.id);

            await expect(
                shiftService.getShiftById(shift.id)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('updateShift', () => {
        it('should update shift fields', async () => {
            const shift = await shiftService.createShift({
                driverId: driver1.id,
                shiftName: 'Original',
                shiftStart: '08:00',
                shiftEnd: '16:00',
                shiftDate: new Date('2026-07-30'),
                isActive: true,
            });

            const updated = await shiftService.updateShift(shift.id, {
                shiftName: 'Updated',
                isActive: false,
            });

            expect(updated.shiftName).toBe('Updated');
            expect(updated.isActive).toBe(false);
            expect(updated.driverId).toBe(driver1.id); // Unchanged
        });

        it('should update shift times', async () => {
            const shift = await shiftService.createShift({
                driverId: driver1.id,
                shiftName: 'Time Test',
                shiftStart: '08:00',
                shiftEnd: '16:00',
                shiftDate: new Date('2026-07-31'),
            });

            const updated = await shiftService.updateShift(shift.id, {
                shiftStart: '10:00',
                shiftEnd: '18:00',
            });

            expect(updated.shiftStart.getHours()).toBe(10);
            expect(updated.shiftEnd.getHours()).toBe(18);
        });

        it('should throw BadRequestError when updating to invalid times', async () => {
            const shift = await shiftService.createShift({
                driverId: driver1.id,
                shiftName: 'Valid Shift',
                shiftStart: '08:00',
                shiftEnd: '16:00',
                shiftDate: new Date('2026-08-01'),
            });

            await expect(
                shiftService.updateShift(shift.id, {
                    shiftStart: '16:00',
                    shiftEnd: '08:00', // Invalid: end before start
                })
            ).rejects.toThrow(BadRequestError);
        });

        it('should throw NotFoundError when updating non-existent shift', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                shiftService.updateShift(fakeId, { shiftName: 'Updated' })
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('deleteShift', () => {
        it('should soft-delete a shift', async () => {
            const shift = await shiftService.createShift({
                driverId: driver1.id,
                shiftName: 'To Delete',
                shiftStart: '08:00',
                shiftEnd: '16:00',
                shiftDate: new Date('2026-08-02'),
            });

            const deleted = await shiftService.deleteShift(shift.id);

            expect(deleted.deletedAt).not.toBeNull();
            expect(deleted.deletedAt).toBeInstanceOf(Date);

            const shifts = await shiftService.listShifts();
            expect(shifts.find(s => s.id === shift.id)).toBeUndefined();
        });

        it('should throw NotFoundError when deleting non-existent shift', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                shiftService.deleteShift(fakeId)
            ).rejects.toThrow(NotFoundError);
        });
    });
});
