import { prismaTest as prisma } from '@/common/test-utils/test-db';
import * as driverService from '../drivers.service';
import { NotFoundError, ConflictError, AppError } from '@/common/errors';
import { createUser } from '@/common/test-utils/factories';
import bcrypt from 'bcryptjs';
import { resetDatabase } from '@/common/test-utils/test-db';

describe('Drivers Service', () => {
    let adminUser: any;
    let terminal: any;
    let driverRole: any;

    beforeAll(async () => {
        adminUser = await createUser({ email: 'admin@test.com' });
    });

    beforeEach(async () => {
        await resetDatabase();

        terminal = await prisma.terminal.create({
            data: { terminalName: 'Test Terminal' },
        });

        // Ensure driver role exists (seed should have created it)
        driverRole = await prisma.role.findFirst({ where: { roleName: 'DRIVER' } });
        if (!driverRole) {
            driverRole = await prisma.role.create({
                data: { roleName: 'DRIVER', description: 'Driver role' },
            });
        }
    });

    afterAll(async () => {
        await prisma.terminal.deleteMany({});
    });

    describe('createDriver', () => {
        it('should create a driver with valid data', async () => {
            const driverData = {
                fullName: 'John Driver',
                email: 'john.driver@test.com',
                phone: '+251911111111',
                password: 'SecurePass123',
                licenseNumber: 'DL-12345',
                licenseExpiry: new Date('2025-12-31'),
                homeTerminalId: terminal.id,
                preferredLanguage: 'en',
                department: 'Operations',
            };

            const driver = await driverService.createDriver(driverData);

            expect(driver).toBeDefined();
            expect(driver.fullName).toBe('John Driver');
            expect(driver.email).toBe('john.driver@test.com');
            expect(driver.phone).toBe('+251911111111');
            expect(driver.licenseNumber).toBe('DL-12345');
            expect(driver.homeTerminalId).toBe(terminal.id);
            expect(driver.passwordHash).toBeDefined();
            expect(driver.passwordHash).not.toBe('SecurePass123'); // Should be hashed

            // Verify password was hashed correctly
            const isValidPassword = await bcrypt.compare('SecurePass123', driver.passwordHash);
            expect(isValidPassword).toBe(true);

            // Verify driver role assigned
            const userRoles = await prisma.userRole.findMany({
                where: { userId: driver.id },
            });
            expect(userRoles).toHaveLength(1);
            expect(userRoles[0].roleId).toBe(driverRole.id);
        });

        it('should create a driver with minimal data', async () => {
            const driverData = {
                fullName: 'Jane Driver',
                email: 'jane@test.com',
                phone: '+251922222222',
                password: 'Pass123',
            };

            const driver = await driverService.createDriver(driverData);

            expect(driver).toBeDefined();
            expect(driver.fullName).toBe('Jane Driver');
            expect(driver.licenseNumber).toBeNull();
            expect(driver.homeTerminalId).toBeNull();
        });

        it('should normalize email to lowercase', async () => {
            const driverData = {
                fullName: 'Test Driver',
                email: 'TEST.DRIVER@EXAMPLE.COM',
                phone: '+251933333333',
                password: 'Pass123',
            };

            const driver = await driverService.createDriver(driverData);

            expect(driver.email).toBe('test.driver@example.com');
        });

        it('should throw ConflictError for duplicate email', async () => {
            const driverData = {
                fullName: 'Driver One',
                email: 'duplicate@test.com',
                phone: '+251944444444',
                password: 'Pass123',
            };

            await driverService.createDriver(driverData);

            await expect(
                driverService.createDriver({
                    ...driverData,
                    phone: '+251955555555', // Different phone
                })
            ).rejects.toThrow(ConflictError);
        });

        it('should throw ConflictError for duplicate phone', async () => {
            const phone = '+251966666666';

            await driverService.createDriver({
                fullName: 'Driver A',
                email: 'drivera@test.com',
                phone,
                password: 'Pass123',
            });

            await expect(
                driverService.createDriver({
                    fullName: 'Driver B',
                    email: 'driverb@test.com',
                    phone, // Same phone
                    password: 'Pass123',
                })
            ).rejects.toThrow(ConflictError);
        });

        it('should throw ConflictError for duplicate license number', async () => {
            const licenseNumber = 'DL-DUPLICATE';

            await driverService.createDriver({
                fullName: 'Driver X',
                email: 'driverx@test.com',
                phone: '+251977777777',
                password: 'Pass123',
                licenseNumber,
            });

            await expect(
                driverService.createDriver({
                    fullName: 'Driver Y',
                    email: 'drivery@test.com',
                    phone: '+251988888888',
                    password: 'Pass123',
                    licenseNumber, // Same license
                })
            ).rejects.toThrow(ConflictError);
        });
    });

    describe('listDrivers', () => {
        let terminal2: any;

        beforeEach(async () => {
            terminal2 = await prisma.terminal.create({
                data: { terminalName: 'Terminal 2' },
            });

            await driverService.createDriver({
                fullName: 'Alice Driver',
                email: 'alice@test.com',
                phone: '+251911111001',
                password: 'Pass123',
                licenseNumber: 'DL-001',
                homeTerminalId: terminal.id,
            });

            await driverService.createDriver({
                fullName: 'Bob Driver',
                email: 'bob@test.com',
                phone: '+251911111002',
                password: 'Pass123',
                licenseNumber: 'DL-002',
                homeTerminalId: terminal2.id,
            });

            const charlie = await driverService.createDriver({
                fullName: 'Charlie Driver',
                email: 'charlie@test.com',
                phone: '+251911111003',
                password: 'Pass123',
                licenseNumber: 'DL-003',
                homeTerminalId: terminal.id,
            });

            // Make Charlie inactive
            await driverService.updateDriver(charlie.id, { isActive: false });
        });

        afterEach(async () => {
            await prisma.terminal.delete({ where: { id: terminal2.id } }).catch(() => { });
        });

        it('should list all drivers', async () => {
            const drivers = await driverService.listDrivers();

            expect(drivers.length).toBeGreaterThanOrEqual(3);
            const names = drivers.map(d => d.fullName);
            expect(names).toContain('Alice Driver');
            expect(names).toContain('Bob Driver');
            expect(names).toContain('Charlie Driver');
        });

        it('should filter drivers by terminal', async () => {
            const drivers = await driverService.listDrivers({ terminalId: terminal.id });

            expect(drivers.length).toBeGreaterThanOrEqual(2);
            expect(drivers.every(d => d.homeTerminalId === terminal.id)).toBe(true);
        });

        it('should filter drivers by active status', async () => {
            const activeDrivers = await driverService.listDrivers({ isActive: true });
            const inactiveDrivers = await driverService.listDrivers({ isActive: false });

            expect(activeDrivers.every(d => d.isActive === true)).toBe(true);
            expect(inactiveDrivers.some(d => d.isActive === false)).toBe(true);
        });

        it('should search drivers by name', async () => {
            const drivers = await driverService.listDrivers({ search: 'Alice' });

            expect(drivers.length).toBeGreaterThanOrEqual(1);
            expect(drivers[0].fullName).toContain('Alice');
        });

        it('should search drivers by email', async () => {
            const drivers = await driverService.listDrivers({ search: 'bob@test.com' });

            expect(drivers.length).toBeGreaterThanOrEqual(1);
            expect(drivers[0].email).toBe('bob@test.com');
        });

        it('should search drivers by license number', async () => {
            const drivers = await driverService.listDrivers({ search: 'DL-003' });

            expect(drivers.length).toBeGreaterThanOrEqual(1);
            expect(drivers[0].licenseNumber).toBe('DL-003');
        });
    });

    describe('getDriverById', () => {
        it('should get driver by ID', async () => {
            const created = await driverService.createDriver({
                fullName: 'Test Driver',
                email: 'testdriver@test.com',
                phone: '+251911111100',
                password: 'Pass123',
                licenseNumber: 'DL-TEST',
            });

            const driver = await driverService.getDriverById(created.id);

            expect(driver).toBeDefined();
            expect(driver.id).toBe(created.id);
            expect(driver.fullName).toBe('Test Driver');
        });

        it('should throw NotFoundError for non-existent driver', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                driverService.getDriverById(fakeId)
            ).rejects.toThrow(NotFoundError);
        });

        it('should throw NotFoundError for soft-deleted driver', async () => {
            const driver = await driverService.createDriver({
                fullName: 'To Delete',
                email: 'todelete@test.com',
                phone: '+251911111200',
                password: 'Pass123',
                licenseNumber: 'DL-DELETE',
            });

            await driverService.deleteDriver(driver.id);

            await expect(
                driverService.getDriverById(driver.id)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('updateDriver', () => {
        it('should update driver fields', async () => {
            const driver = await driverService.createDriver({
                fullName: 'Original Name',
                email: 'original@test.com',
                phone: '+251911111300',
                password: 'Pass123',
                licenseNumber: 'DL-ORIG',
            });

            const updated = await driverService.updateDriver(driver.id, {
                fullName: 'Updated Name',
                licenseExpiry: new Date('2026-06-30'),
            });

            expect(updated.fullName).toBe('Updated Name');
            expect(updated.licenseExpiry).toBeDefined();
            expect(updated.email).toBe('original@test.com'); // Unchanged
        });

        it('should throw NotFoundError when updating non-existent driver', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                driverService.updateDriver(fakeId, { fullName: 'New Name' })
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('deleteDriver', () => {
        it('should soft-delete a driver', async () => {
            const driver = await driverService.createDriver({
                fullName: 'To Delete',
                email: 'deleteme@test.com',
                phone: '+251911111400',
                password: 'Pass123',
                licenseNumber: 'DL-DEL',
            });

            const deleted = await driverService.deleteDriver(driver.id);

            expect(deleted.deletedAt).not.toBeNull();

            const drivers = await driverService.listDrivers();
            expect(drivers.find(d => d.id === driver.id)).toBeUndefined();
        });

        it('should throw NotFoundError when deleting non-existent driver', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                driverService.deleteDriver(fakeId)
            ).rejects.toThrow(NotFoundError);
        });
    });
});
