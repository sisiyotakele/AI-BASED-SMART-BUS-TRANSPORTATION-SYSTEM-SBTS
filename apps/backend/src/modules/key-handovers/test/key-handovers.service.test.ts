import { prismaTest as prisma } from '@/common/test-utils/test-db';
import * as handoverService from '../key-handovers.service';
import { NotFoundError, BadRequestError } from '@/common/errors';
import { createUser } from '@/common/test-utils/factories';

describe('Key Handovers Service', () => {
    let driver1: any;
    let driver2: any;
    let bus: any;
    let terminal: any;
    let shift1: any;
    let shift2: any;

    beforeEach(async () => {
        const timestamp = Date.now();
        driver1 = await createUser({ email: `driver1-${timestamp}@test.com`, licenseNumber: `DL-001-${timestamp}` });
        driver2 = await createUser({ email: `driver2-${timestamp}@test.com`, licenseNumber: `DL-002-${timestamp}` });

        terminal = await prisma.terminal.create({
            data: { terminalName: `Test Terminal ${Date.now()}` },
        });

        bus = await prisma.bus.create({
            data: {
                plateNumber: `BUS-001-${Date.now()}`,
                terminalId: terminal.id,
                model: 'Test Model',
                capacity: 40
            },
        });

        const shiftDate = new Date('2026-08-01');
        shift1 = await prisma.shift.create({
            data: {
                driverId: driver1.id,
                shiftName: 'Morning Shift',
                shiftStart: new Date(shiftDate.setHours(6, 0, 0, 0)),
                shiftEnd: new Date(shiftDate.setHours(14, 0, 0, 0)),
                shiftDate: new Date('2026-08-01'),
            },
        });

        shift2 = await prisma.shift.create({
            data: {
                driverId: driver2.id,
                shiftName: 'Afternoon Shift',
                shiftStart: new Date(shiftDate.setHours(14, 0, 0, 0)),
                shiftEnd: new Date(shiftDate.setHours(22, 0, 0, 0)),
                shiftDate: new Date('2026-08-01'),
            },
        });
    });

    describe('createHandover', () => {
        it('should create a handover with valid data', async () => {
            const handoverData = {
                busId: bus.id,
                terminalId: terminal.id,
                fromShiftId: shift1.id,
                toShiftId: shift2.id,
                handoverTime: new Date('2026-08-01T14:00:00Z'),
                notes: 'Bus is in good condition',
            };

            const handover = await handoverService.createHandover(handoverData, driver1.id);

            expect(handover).toBeDefined();
            expect(handover.busId).toBe(bus.id);
            expect(handover.terminalId).toBe(terminal.id);
            expect(handover.fromShiftId).toBe(shift1.id);
            expect(handover.toShiftId).toBe(shift2.id);
            expect(handover.status).toBe('pending');
            expect(handover.notes).toBe('Bus is in good condition');
            expect(handover.bus).toBeDefined();
            expect(handover.terminal).toBeDefined();
            expect(handover.fromShift).toBeDefined();
            expect(handover.toShift).toBeDefined();
            if (handover.fromShift) {
                expect(handover.fromShift.driver).toBeDefined();
            }
        });

        it('should create a handover with minimal data', async () => {
            const handoverData = {
                busId: bus.id,
                terminalId: terminal.id,
                fromShiftId: shift1.id,
                toShiftId: shift2.id,
                handoverTime: new Date('2026-08-01T14:00:00Z'),
            };

            const handover = await handoverService.createHandover(handoverData);

            expect(handover).toBeDefined();
            expect(handover.notes).toBeNull();
            expect(handover.status).toBe('pending');
            expect(handover.confirmedByFrom).toBe(false);
            expect(handover.confirmedByTo).toBe(false);
        });

        it('should default status to pending', async () => {
            const handoverData = {
                busId: bus.id,
                terminalId: terminal.id,
                fromShiftId: shift1.id,
                toShiftId: shift2.id,
                handoverTime: new Date('2026-08-01T14:00:00Z'),
            };

            const handover = await handoverService.createHandover(handoverData);

            expect(handover.status).toBe('pending');
            expect(handover.confirmedByFrom).toBe(false);
            expect(handover.confirmedByTo).toBe(false);
        });
    });

    describe('listHandovers', () => {
        let bus2: any;

        beforeEach(async () => {
            bus2 = await prisma.bus.create({
                data: {
                    plateNumber: `BUS-002-${Date.now()}`,
                    terminalId: terminal.id,
                    model: 'Test Model',
                    capacity: 40
                },
            });

            await handoverService.createHandover({
                busId: bus.id,
                terminalId: terminal.id,
                fromShiftId: shift1.id,
                toShiftId: shift2.id,
                handoverTime: new Date('2026-08-01T14:00:00Z'),
            });

            await handoverService.createHandover({
                busId: bus2.id,
                terminalId: terminal.id,
                fromShiftId: shift1.id,
                toShiftId: shift2.id,
                handoverTime: new Date('2026-08-01T15:00:00Z'),
            });

            await handoverService.createHandover({
                busId: bus.id,
                terminalId: terminal.id,
                fromShiftId: shift1.id,
                toShiftId: shift2.id,
                handoverTime: new Date('2026-08-02T14:00:00Z'),
            });
        });

        it('should list all handovers', async () => {
            const handovers = await handoverService.listHandovers();

            expect(handovers).toHaveLength(3);
            expect(handovers[0].bus).toBeDefined();
            expect(handovers[0].terminal).toBeDefined();
            expect(handovers[0].fromShift).toBeDefined();
            expect(handovers[0].toShift).toBeDefined();
        });

        it('should list handovers ordered by time (desc)', async () => {
            const handovers = await handoverService.listHandovers();

            expect(handovers[0].handoverTime > handovers[1].handoverTime).toBe(true);
            expect(handovers[1].handoverTime > handovers[2].handoverTime).toBe(true);
        });

        it('should filter handovers by bus', async () => {
            const handovers = await handoverService.listHandovers({ busId: bus.id });

            expect(handovers).toHaveLength(2);
            expect(handovers.every(h => h.busId === bus.id)).toBe(true);
        });

        it('should filter handovers by date', async () => {
            const date = new Date('2026-08-01');
            const handovers = await handoverService.listHandovers({ date });

            expect(handovers).toHaveLength(2);
        });
    });

    describe('getHandoverById', () => {
        it('should get handover by ID', async () => {
            const created = await handoverService.createHandover({
                busId: bus.id,
                terminalId: terminal.id,
                fromShiftId: shift1.id,
                toShiftId: shift2.id,
                handoverTime: new Date('2026-08-01T14:00:00Z'),
            });

            const handover = await handoverService.getHandoverById(created.id);

            expect(handover).toBeDefined();
            expect(handover.id).toBe(created.id);
            expect(handover.bus).toBeDefined();
            if (handover.fromShift) {
                expect(handover.fromShift.driver).toBeDefined();
            }
            expect(handover.toShift.driver).toBeDefined();
        });

        it('should throw NotFoundError for non-existent handover', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                handoverService.getHandoverById(fakeId)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('confirmFrom', () => {
        it('should confirm handover by outgoing driver', async () => {
            const handover = await handoverService.createHandover({
                busId: bus.id,
                terminalId: terminal.id,
                fromShiftId: shift1.id,
                toShiftId: shift2.id,
                handoverTime: new Date('2026-08-01T14:00:00Z'),
            });

            const confirmed = await handoverService.confirmFrom(handover.id);

            expect(confirmed.confirmedByFrom).toBe(true);
            expect(confirmed.confirmedByTo).toBe(false);
            expect(confirmed.status).toBe('pending'); // Still pending until both confirm
        });

        it('should set status to confirmed when both drivers confirm', async () => {
            const handover = await handoverService.createHandover({
                busId: bus.id,
                terminalId: terminal.id,
                fromShiftId: shift1.id,
                toShiftId: shift2.id,
                handoverTime: new Date('2026-08-01T14:00:00Z'),
            });

            await handoverService.confirmTo(handover.id);
            const confirmed = await handoverService.confirmFrom(handover.id);

            expect(confirmed.confirmedByFrom).toBe(true);
            expect(confirmed.confirmedByTo).toBe(true);
            expect(confirmed.status).toBe('confirmed');
        });

        it('should throw BadRequestError when already confirmed by outgoing driver', async () => {
            const handover = await handoverService.createHandover({
                busId: bus.id,
                terminalId: terminal.id,
                fromShiftId: shift1.id,
                toShiftId: shift2.id,
                handoverTime: new Date('2026-08-01T14:00:00Z'),
            });

            await handoverService.confirmFrom(handover.id);

            await expect(
                handoverService.confirmFrom(handover.id)
            ).rejects.toThrow(BadRequestError);

            await expect(
                handoverService.confirmFrom(handover.id)
            ).rejects.toThrow('Already confirmed by outgoing driver');
        });

        it('should throw NotFoundError for non-existent handover', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                handoverService.confirmFrom(fakeId)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('confirmTo', () => {
        it('should confirm handover by incoming driver', async () => {
            const handover = await handoverService.createHandover({
                busId: bus.id,
                terminalId: terminal.id,
                fromShiftId: shift1.id,
                toShiftId: shift2.id,
                handoverTime: new Date('2026-08-01T14:00:00Z'),
            });

            const confirmed = await handoverService.confirmTo(handover.id);

            expect(confirmed.confirmedByTo).toBe(true);
            expect(confirmed.confirmedByFrom).toBe(false);
            expect(confirmed.status).toBe('pending');
        });

        it('should set status to confirmed when both drivers confirm', async () => {
            const handover = await handoverService.createHandover({
                busId: bus.id,
                terminalId: terminal.id,
                fromShiftId: shift1.id,
                toShiftId: shift2.id,
                handoverTime: new Date('2026-08-01T14:00:00Z'),
            });

            await handoverService.confirmFrom(handover.id);
            const confirmed = await handoverService.confirmTo(handover.id);

            expect(confirmed.confirmedByFrom).toBe(true);
            expect(confirmed.confirmedByTo).toBe(true);
            expect(confirmed.status).toBe('confirmed');
        });

        it('should throw BadRequestError when already confirmed by incoming driver', async () => {
            const handover = await handoverService.createHandover({
                busId: bus.id,
                terminalId: terminal.id,
                fromShiftId: shift1.id,
                toShiftId: shift2.id,
                handoverTime: new Date('2026-08-01T14:00:00Z'),
            });

            await handoverService.confirmTo(handover.id);

            await expect(
                handoverService.confirmTo(handover.id)
            ).rejects.toThrow(BadRequestError);

            await expect(
                handoverService.confirmTo(handover.id)
            ).rejects.toThrow('Already confirmed by incoming driver');
        });

        it('should throw NotFoundError for non-existent handover', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                handoverService.confirmTo(fakeId)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('Workflow Scenarios', () => {
        it('should handle complete handover workflow', async () => {
            // 1. Create handover
            const handover = await handoverService.createHandover({
                busId: bus.id,
                terminalId: terminal.id,
                fromShiftId: shift1.id,
                toShiftId: shift2.id,
                handoverTime: new Date('2026-08-01T14:00:00Z'),
                notes: 'Clean bus, full tank',
            });

            expect(handover.status).toBe('pending');

            // 2. Outgoing driver confirms
            const step1 = await handoverService.confirmFrom(handover.id);
            expect(step1.confirmedByFrom).toBe(true);
            expect(step1.status).toBe('pending');

            // 3. Incoming driver confirms
            const step2 = await handoverService.confirmTo(handover.id);
            expect(step2.confirmedByTo).toBe(true);
            expect(step2.status).toBe('confirmed');

            // 4. Verify final state
            const final = await handoverService.getHandoverById(handover.id);
            expect(final.status).toBe('confirmed');
            expect(final.confirmedByFrom).toBe(true);
            expect(final.confirmedByTo).toBe(true);
        });
    });
});
