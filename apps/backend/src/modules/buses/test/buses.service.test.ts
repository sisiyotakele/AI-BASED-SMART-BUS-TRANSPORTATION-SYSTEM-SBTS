import { prismaTest, resetDatabase } from '@/common/test-utils/test-db';
import * as busService from '../buses.service';
import { NotFoundError, ConflictError } from '@/common/errors';
import { createUser } from '@/common/test-utils/factories';

describe('Buses Service', () => {
    let adminUser: any;
    let terminal: any;

    beforeEach(async () => {
        await resetDatabase();
        adminUser = await createUser({ email: 'admin@test.com' });
        terminal = await prismaTest.terminal.create({
            data: { terminalName: 'Test Terminal' },
        });
    });

    beforeEach(async () => {
        await resetDatabase();
        adminUser = await createUser({ email: 'admin@test.com' });
        terminal = await prismaTest.terminal.create({
            data: { terminalName: 'Test Terminal' },
        });
    });

    describe('createBus', () => {
        it('should create a bus with valid data', async () => {
            const busData = {
                plateNumber: 'ABC-1234',
                model: 'Mercedes Sprinter',
                capacity: 50,
                terminalId: terminal.id,
                maintenanceStatus: 'operational',
            };

            const bus = await busService.createBus(busData, adminUser.id);

            expect(bus).toBeDefined();
            expect(bus.plateNumber).toBe('ABC-1234');
            expect(bus.model).toBe('Mercedes Sprinter');
            expect(bus.capacity).toBe(50);
            expect(bus.maintenanceStatus).toBe('operational');
        });

        it('should create a bus with minimal data', async () => {
            const busData = {
                plateNumber: 'XYZ-5678',
                model: 'Default Model',
                capacity: 30,
                terminalId: terminal.id,
            };

            const bus = await busService.createBus(busData, adminUser.id);

            expect(bus).toBeDefined();
            expect(bus.plateNumber).toBe('XYZ-5678');
        });

        it('should throw ConflictError for duplicate plate number', async () => {
            const busData = {
                plateNumber: 'DUP-1234',
                model: 'Test Model',
                capacity: 40,
                terminalId: terminal.id,
            };

            await busService.createBus(busData, adminUser.id);

            await expect(
                busService.createBus(busData, adminUser.id)
            ).rejects.toThrow(ConflictError);

            await expect(
                busService.createBus(busData, adminUser.id)
            ).rejects.toThrow('Plate number already exists');
        });
    });

    describe('listBuses', () => {
        let terminal2: any;

        beforeEach(async () => {
            terminal2 = await prismaTest.terminal.create({
                data: { terminalName: 'Terminal 2' },
            });

            await busService.createBus({
                plateNumber: 'BUS-001',
                model: 'Mercedes',
                capacity: 50,
                terminalId: terminal.id,
                maintenanceStatus: 'operational',
            }, adminUser.id);

            await busService.createBus({
                plateNumber: 'BUS-002',
                model: 'Volvo',
                capacity: 45,
                terminalId: terminal2.id,
                maintenanceStatus: 'in_maintenance',
            }, adminUser.id);

            await busService.createBus({
                plateNumber: 'BUS-003',
                model: 'Scania',
                capacity: 55,
                terminalId: terminal.id,
                maintenanceStatus: 'operational',
            }, adminUser.id);
        });

        it('should list all buses', async () => {
            const buses = await busService.listBuses();

            expect(buses).toHaveLength(3);
            expect(buses[0].plateNumber).toBe('BUS-001');
        });

        it('should filter buses by terminal', async () => {
            const buses = await busService.listBuses({ terminalId: terminal.id });

            expect(buses).toHaveLength(2);
            expect(buses.every(b => b.terminalId === terminal.id)).toBe(true);
        });

        it('should filter buses by maintenance status', async () => {
            const buses = await busService.listBuses({ status: 'operational' });

            expect(buses).toHaveLength(2);
            expect(buses.every(b => b.maintenanceStatus === 'operational')).toBe(true);
        });

        it('should search buses by plate number', async () => {
            const buses = await busService.listBuses({ search: '002' });

            expect(buses).toHaveLength(1);
            expect(buses[0].plateNumber).toBe('BUS-002');
        });

        it('should search buses by model', async () => {
            const buses = await busService.listBuses({ search: 'Volvo' });

            expect(buses).toHaveLength(1);
            expect(buses[0].model).toBe('Volvo');
        });

        it('should not return soft-deleted buses', async () => {
            const bus = await busService.createBus({
                plateNumber: 'DEL-001',
                model: 'Test Bus',
                capacity: 40,
                terminalId: terminal.id,
            }, adminUser.id);

            await busService.deleteBus(bus.id);

            const buses = await busService.listBuses();
            expect(buses).toHaveLength(3);
            expect(buses.find(b => b.id === bus.id)).toBeUndefined();
        });
    });

    describe('getBusById', () => {
        it('should get bus by ID', async () => {
            const created = await busService.createBus({
                plateNumber: 'TEST-123',
                model: 'Test Model',
                capacity: 40,
                terminalId: terminal.id,
            }, adminUser.id);

            const bus = await busService.getBusById(created.id);

            expect(bus).toBeDefined();
            expect(bus.id).toBe(created.id);
            expect(bus.plateNumber).toBe('TEST-123');
        });

        it('should throw NotFoundError for non-existent bus', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                busService.getBusById(fakeId)
            ).rejects.toThrow(NotFoundError);
        });

        it('should throw NotFoundError for soft-deleted bus', async () => {
            const created = await busService.createBus({
                plateNumber: 'DEL-123',
                model: 'Test Model',
                capacity: 40,
                terminalId: terminal.id,
            }, adminUser.id);

            await busService.deleteBus(created.id);

            await expect(
                busService.getBusById(created.id)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('updateBus', () => {
        it('should update bus fields', async () => {
            const created = await busService.createBus({
                plateNumber: 'OLD-123',
                model: 'Old Model',
                capacity: 50,
                terminalId: terminal.id,
            }, adminUser.id);

            const updated = await busService.updateBus(created.id, {
                plateNumber: 'NEW-123',
                model: 'New Model',
                capacity: 60,
            });

            expect(updated.plateNumber).toBe('NEW-123');
            expect(updated.model).toBe('New Model');
            expect(updated.capacity).toBe(60);
        });

        it('should throw NotFoundError when updating non-existent bus', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                busService.updateBus(fakeId, { model: 'New Model' })
            ).rejects.toThrow(NotFoundError);
        });

        it('should throw ConflictError when updating to duplicate plate number', async () => {
            await busService.createBus({
                plateNumber: 'BUS-A',
                model: 'Model A',
                capacity: 40,
                terminalId: terminal.id,
            }, adminUser.id);

            const busB = await busService.createBus({
                plateNumber: 'BUS-B',
                model: 'Model B',
                capacity: 40,
                terminalId: terminal.id,
            }, adminUser.id);

            await expect(
                busService.updateBus(busB.id, { plateNumber: 'BUS-A' })
            ).rejects.toThrow(ConflictError);
        });
    });

    describe('updateMaintenanceStatus', () => {
        it('should update maintenance status', async () => {
            const bus = await busService.createBus({
                plateNumber: 'MAINT-123',
                model: 'Test Model',
                capacity: 40,
                terminalId: terminal.id,
                maintenanceStatus: 'operational',
            }, adminUser.id);

            const updated = await busService.updateMaintenanceStatus(bus.id, 'in_maintenance');

            expect(updated.maintenanceStatus).toBe('in_maintenance');
        });

        it('should throw NotFoundError for non-existent bus', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                busService.updateMaintenanceStatus(fakeId, 'retired')
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('deleteBus', () => {
        it('should soft-delete a bus', async () => {
            const bus = await busService.createBus({
                plateNumber: 'DEL-999',
                model: 'Test Model',
                capacity: 40,
                terminalId: terminal.id,
            }, adminUser.id);

            const deleted = await busService.deleteBus(bus.id);

            expect(deleted.deletedAt).not.toBeNull();
            expect(deleted.deletedAt).toBeInstanceOf(Date);

            const buses = await busService.listBuses();
            expect(buses.find(b => b.id === bus.id)).toBeUndefined();
        });

        it('should throw NotFoundError when deleting non-existent bus', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                busService.deleteBus(fakeId)
            ).rejects.toThrow(NotFoundError);
        });
    });
});
