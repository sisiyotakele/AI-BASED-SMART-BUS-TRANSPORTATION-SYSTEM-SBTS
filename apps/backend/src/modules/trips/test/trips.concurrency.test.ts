/**
 * Concurrency Tests for Trip Creation
 * 
 * These tests verify that the double-booking prevention works correctly
 * even under concurrent load (race conditions).
 */

import { prismaTest, resetDatabase } from '@/common/test-utils/test-db';
import * as tripsService from '../trips.service';

describe('Trip Creation - Concurrency & Race Conditions', () => {
    beforeEach(async () => {
        await resetDatabase();
    });

    async function setupTripDeps() {
        // Create role
        await prismaTest.role.create({
            data: { roleName: 'driver', description: 'Driver role' },
        });

        // Create terminal
        const terminal = await prismaTest.terminal.create({
            data: { terminalName: 'Terminal A' },
        });

        // Create bus
        const bus = await prismaTest.bus.create({
            data: {
                plateNumber: `BUS-${Date.now()}`,
                model: 'Mercedes',
                capacity: 50,
                terminalId: terminal.id,
            },
        });

        // Create driver
        const driver = await prismaTest.user.create({
            data: {
                fullName: 'Test Driver',
                email: `driver${Date.now()}@test.com`,
                phone: `+251${Date.now().toString().slice(-9)}`,
                passwordHash: 'hash',
                licenseNumber: `LIC-${Date.now()}`,
                licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            },
        });

        // Create stops
        const startStop = await prismaTest.stop.create({
            data: { stopName: 'Start Stop', stopCode: `START-${Date.now()}` },
        });
        const endStop = await prismaTest.stop.create({
            data: { stopName: 'End Stop', stopCode: `END-${Date.now()}` },
        });

        // Create route
        const route = await prismaTest.route.create({
            data: {
                routeName: 'Route 1',
                startStopId: startStop.id,
                endStopId: endStop.id,
            },
        });

        // Create route version
        const version = await prismaTest.routeVersion.create({
            data: {
                routeId: route.id,
                versionNumber: 1,
                isActive: true,
            },
        });

        // Create schedule
        const schedule = await prismaTest.schedule.create({
            data: {
                routeId: route.id,
                versionId: version.id,
                scheduleName: 'Morning Schedule',
                dayOfWeek: 'monday',
                departureTime: new Date('2024-01-01T08:00:00Z'),
            },
        });

        return { bus, driver, version, schedule };
    }

    describe('Race Condition Protection', () => {
        it('should prevent bus double-booking when two requests arrive simultaneously', async () => {
            const { bus, driver, version, schedule } = await setupTripDeps();

            // Create another driver for the concurrent request
            const driver2 = await prismaTest.user.create({
                data: {
                    fullName: 'Test Driver 2',
                    email: `driver2-${Date.now()}@test.com`,
                    phone: `+251${Date.now().toString().slice(-9)}`,
                    passwordHash: 'hash',
                    licenseNumber: `LIC2-${Date.now()}`,
                    licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                },
            });

            const tripData1 = {
                busId: bus.id,
                driverId: driver.id,
                versionId: version.id,
                scheduleId: schedule.id,
                scheduledStart: new Date(Date.now() + 3600000),
                scheduledEnd: new Date(Date.now() + 7200000),
            };

            const tripData2 = {
                busId: bus.id, // Same bus!
                driverId: driver2.id, // Different driver
                versionId: version.id,
                scheduleId: schedule.id,
                scheduledStart: new Date(Date.now() + 3600000), // Overlapping time!
                scheduledEnd: new Date(Date.now() + 7200000),
            };

            // Fire both requests simultaneously
            const [result1, result2] = await Promise.allSettled([
                tripsService.createTrip(tripData1),
                tripsService.createTrip(tripData2),
            ]);

            // One should succeed, one should fail
            const successes = [result1, result2].filter(r => r.status === 'fulfilled');
            const failures = [result1, result2].filter(r => r.status === 'rejected');

            expect(successes).toHaveLength(1);
            expect(failures).toHaveLength(1);

            // The failure should be a conflict error
            const failure = failures[0] as PromiseRejectedResult;
            expect(failure.reason.message).toMatch(/overlapping trip|DOUBLE_BOOKED/i);
        }, 10000); // 10 second timeout

        it('should prevent driver double-booking when two requests arrive simultaneously', async () => {
            const { bus, driver, version, schedule } = await setupTripDeps();

            // Create another bus for the concurrent request
            const bus2 = await prismaTest.bus.create({
                data: {
                    plateNumber: `BUS2-${Date.now()}`,
                    model: 'Volvo',
                    capacity: 45,
                },
            });

            const tripData1 = {
                busId: bus.id,
                driverId: driver.id,
                versionId: version.id,
                scheduleId: schedule.id,
                scheduledStart: new Date(Date.now() + 3600000),
                scheduledEnd: new Date(Date.now() + 7200000),
            };

            const tripData2 = {
                busId: bus2.id, // Different bus
                driverId: driver.id, // Same driver!
                versionId: version.id,
                scheduleId: schedule.id,
                scheduledStart: new Date(Date.now() + 3600000), // Overlapping time!
                scheduledEnd: new Date(Date.now() + 7200000),
            };

            // Fire both requests simultaneously
            const [result1, result2] = await Promise.allSettled([
                tripsService.createTrip(tripData1),
                tripsService.createTrip(tripData2),
            ]);

            // One should succeed, one should fail
            const successes = [result1, result2].filter(r => r.status === 'fulfilled');
            const failures = [result1, result2].filter(r => r.status === 'rejected');

            expect(successes).toHaveLength(1);
            expect(failures).toHaveLength(1);

            // The failure should be a conflict error
            const failure = failures[0] as PromiseRejectedResult;
            expect(failure.reason.message).toMatch(/overlapping trip|DOUBLE_BOOKED/i);
        }, 10000);

        it('should handle 10 concurrent requests correctly (stress test)', async () => {
            const { bus, driver, version, schedule } = await setupTripDeps();

            // Create 10 drivers
            const drivers = await Promise.all(
                Array.from({ length: 10 }, (_, i) =>
                    prismaTest.user.create({
                        data: {
                            fullName: `Driver ${i}`,
                            email: `driver${i}-${Date.now()}@test.com`,
                            phone: `+251${Date.now().toString().slice(-9)}${i}`,
                            passwordHash: 'hash',
                            licenseNumber: `LIC${i}-${Date.now()}`,
                            licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                        },
                    })
                )
            );

            // All trying to book the same bus at the same time
            const requests = drivers.map((driver) => ({
                busId: bus.id,
                driverId: driver.id,
                versionId: version.id,
                scheduleId: schedule.id,
                scheduledStart: new Date(Date.now() + 3600000),
                scheduledEnd: new Date(Date.now() + 7200000),
            }));

            // Fire all 10 requests simultaneously
            const results = await Promise.allSettled(
                requests.map(data => tripsService.createTrip(data))
            );

            // Only ONE should succeed
            const successes = results.filter(r => r.status === 'fulfilled');
            const failures = results.filter(r => r.status === 'rejected');

            expect(successes).toHaveLength(1);
            expect(failures).toHaveLength(9);

            // All failures should be conflict errors
            failures.forEach((failure) => {
                const rejected = failure as PromiseRejectedResult;
                expect(rejected.reason.message).toMatch(/overlapping trip|DOUBLE_BOOKED/i);
            });
        }, 30000); // 30 second timeout for stress test
    });

    describe('Valid Concurrent Bookings', () => {
        it('should allow concurrent bookings for different buses and drivers', async () => {
            const { bus, driver, version, schedule } = await setupTripDeps();

            // Create second bus and driver
            const bus2 = await prismaTest.bus.create({
                data: {
                    plateNumber: `BUS2-${Date.now()}`,
                    model: 'Volvo',
                    capacity: 45,
                },
            });

            const driver2 = await prismaTest.user.create({
                data: {
                    fullName: 'Driver 2',
                    email: `driver2-${Date.now()}@test.com`,
                    phone: `+251${Date.now().toString().slice(-9)}`,
                    passwordHash: 'hash',
                    licenseNumber: `LIC2-${Date.now()}`,
                    licenseExpiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
                },
            });

            const tripData1 = {
                busId: bus.id,
                driverId: driver.id,
                versionId: version.id,
                scheduleId: schedule.id,
                scheduledStart: new Date(Date.now() + 3600000),
                scheduledEnd: new Date(Date.now() + 7200000),
            };

            const tripData2 = {
                busId: bus2.id, // Different bus
                driverId: driver2.id, // Different driver
                versionId: version.id,
                scheduleId: schedule.id,
                scheduledStart: new Date(Date.now() + 3600000), // Same time is OK!
                scheduledEnd: new Date(Date.now() + 7200000),
            };

            // Both should succeed
            const [result1, result2] = await Promise.allSettled([
                tripsService.createTrip(tripData1),
                tripsService.createTrip(tripData2),
            ]);

            expect(result1.status).toBe('fulfilled');
            expect(result2.status).toBe('fulfilled');
        });

        it('should allow same bus/driver for non-overlapping time slots', async () => {
            const { bus, driver, version, schedule } = await setupTripDeps();

            const tripData1 = {
                busId: bus.id,
                driverId: driver.id,
                versionId: version.id,
                scheduleId: schedule.id,
                scheduledStart: new Date(Date.now() + 3600000), // 1 hour from now
                scheduledEnd: new Date(Date.now() + 7200000), // 2 hours from now
            };

            const tripData2 = {
                busId: bus.id, // Same bus
                driverId: driver.id, // Same driver
                versionId: version.id,
                scheduleId: schedule.id,
                scheduledStart: new Date(Date.now() + 7200000), // Starts when trip1 ends
                scheduledEnd: new Date(Date.now() + 10800000), // 3 hours from now
            };

            // Both should succeed (no overlap)
            const trip1 = await tripsService.createTrip(tripData1);
            const trip2 = await tripsService.createTrip(tripData2);

            expect(trip1).toBeDefined();
            expect(trip2).toBeDefined();
            expect(trip1.id).not.toBe(trip2.id);
        });
    });
});
