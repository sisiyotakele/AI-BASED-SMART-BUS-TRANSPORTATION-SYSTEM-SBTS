import { prismaTest as prisma } from '@/common/test-utils/test-db';
import * as routesStopsService from '../routes-stops.service';
import { NotFoundError, ConflictError, BadRequestError } from '@/common/errors';
import { createUser } from '@/common/test-utils/factories';
import { resetDatabase } from '@/common/test-utils/test-db';

describe('Routes and Stops Service', () => {
    let adminUser: any;

    beforeEach(async () => {
        await resetDatabase();
        adminUser = await createUser({ email: `admin-routes-${Date.now()}@test.com` });
    });

    // ============================================================
    // STOPS TESTS
    // ============================================================

    describe('Stops - createStop', () => {
        it('should create a stop with valid data', async () => {
            const stopData = {
                stopName: 'Central Station',
                stopCode: 'CS-001',
                latitude: 9.0192,
                longitude: 38.7525,
                address: 'Main St, City Center',
            };

            const stop = await routesStopsService.createStop(stopData, adminUser.id);

            expect(stop).toBeDefined();
            expect(stop.stopName).toBe('Central Station');
            expect(stop.stopCode).toBe('CS-001');
            expect(Number(stop.latitude)).toBeCloseTo(9.0192);
        });

        it('should throw ConflictError for duplicate stop code', async () => {
            const stopData = {
                stopName: 'Stop A',
                stopCode: 'DUP-001',
            };

            await routesStopsService.createStop(stopData, adminUser.id);

            await expect(
                routesStopsService.createStop(stopData, adminUser.id)
            ).rejects.toThrow(ConflictError);
        });
    });

    describe('Stops - listStops', () => {
        beforeEach(async () => {
            await routesStopsService.createStop({ stopName: 'Stop A', stopCode: 'SA' });
            await routesStopsService.createStop({ stopName: 'Stop B', stopCode: 'SB' });
            await routesStopsService.createStop({ stopName: 'Stop C', stopCode: 'SC' });
        });

        it('should list all stops', async () => {
            const stops = await routesStopsService.listStops();

            expect(stops).toHaveLength(3);
            expect(stops[0].stopName).toBe('Stop A');
        });

        it('should search stops by name', async () => {
            const stops = await routesStopsService.listStops('Stop B');

            expect(stops).toHaveLength(1);
            expect(stops[0].stopName).toBe('Stop B');
        });

        it('should search stops by code', async () => {
            const stops = await routesStopsService.listStops('SC');

            expect(stops).toHaveLength(1);
            expect(stops[0].stopCode).toBe('SC');
        });
    });

    describe('Stops - getStopById', () => {
        it('should get stop by ID', async () => {
            const created = await routesStopsService.createStop({
                stopName: 'Test Stop',
                stopCode: 'TS-001',
            });

            const stop = await routesStopsService.getStopById(created.id);

            expect(stop.id).toBe(created.id);
            expect(stop.stopName).toBe('Test Stop');
        });

        it('should throw NotFoundError for non-existent stop', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                routesStopsService.getStopById(fakeId)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('Stops - updateStop', () => {
        it('should update stop fields', async () => {
            const stop = await routesStopsService.createStop({
                stopName: 'Original Name',
                stopCode: 'ORIG',
            });

            const updated = await routesStopsService.updateStop(stop.id, {
                stopName: 'Updated Name',
                address: 'New Address',
            });

            expect(updated.stopName).toBe('Updated Name');
            expect(updated.address).toBe('New Address');
        });

        it('should throw ConflictError when updating to duplicate code', async () => {
            await routesStopsService.createStop({ stopName: 'Stop A', stopCode: 'CODE-A' });
            const stopB = await routesStopsService.createStop({ stopName: 'Stop B', stopCode: 'CODE-B' });

            await expect(
                routesStopsService.updateStop(stopB.id, { stopCode: 'CODE-A' })
            ).rejects.toThrow(ConflictError);
        });
    });

    describe('Stops - deleteStop', () => {
        it('should soft-delete a stop', async () => {
            const stop = await routesStopsService.createStop({
                stopName: 'To Delete',
                stopCode: 'DEL',
            });

            const deleted = await routesStopsService.deleteStop(stop.id);

            expect(deleted.deletedAt).not.toBeNull();
        });
    });

    describe('Stops - findNearbyStops', () => {
        beforeEach(async () => {
            await routesStopsService.createStop({
                stopName: 'Close Stop',
                stopCode: 'CLOSE',
                latitude: 9.0200,
                longitude: 38.7530,
            });

            await routesStopsService.createStop({
                stopName: 'Far Stop',
                stopCode: 'FAR',
                latitude: 9.1000,
                longitude: 38.8500,
            });
        });

        it('should find nearby stops within radius', async () => {
            const nearbyStops = await routesStopsService.findNearbyStops(9.0192, 38.7525, 5);

            expect(nearbyStops.length).toBeGreaterThanOrEqual(1);
            expect(nearbyStops[0]).toHaveProperty('distanceKm');
        });
    });

    // ============================================================
    // ROUTES TESTS
    // ============================================================

    describe('Routes - createRoute', () => {
        let startStop: any;
        let endStop: any;

        beforeEach(async () => {
            const uniqueId = Date.now() + Math.random();
            startStop = await routesStopsService.createStop({ stopName: 'Start', stopCode: `START-CR-${uniqueId}` });
            endStop = await routesStopsService.createStop({ stopName: 'End', stopCode: `END-CR-${uniqueId}` });
        });

        it('should create a route with initial version', async () => {
            const routeData = {
                routeName: 'Route 1',
                description: 'Test route',
                startStopId: startStop.id,
                endStopId: endStop.id,
            };

            const route = await routesStopsService.createRoute(routeData, adminUser.id);

            expect(route).toBeDefined();
            expect(route.routeName).toBe('Route 1');

            // Verify initial version created
            const versions = await prisma.routeVersion.findMany({
                where: { routeId: route.id },
            });
            expect(versions).toHaveLength(1);
            expect(versions[0].versionNumber).toBe(1);
            expect(versions[0].isActive).toBe(true);
        });
    });

    describe('Routes - listRoutes', () => {
        let startStop: any;
        let endStop: any;

        beforeEach(async () => {
            const uniqueId = Date.now() + Math.random();
            startStop = await routesStopsService.createStop({ stopName: 'Start', stopCode: `START-LR-${uniqueId}` });
            endStop = await routesStopsService.createStop({ stopName: 'End', stopCode: `END-LR-${uniqueId}` });

            await routesStopsService.createRoute({
                routeName: 'Route A',
                description: 'Description A',
                startStopId: startStop.id,
                endStopId: endStop.id,
            });

            await routesStopsService.createRoute({
                routeName: 'Route B',
                description: 'Description B',
                startStopId: startStop.id,
                endStopId: endStop.id,
            });
        });

        it('should list all routes with versions', async () => {
            const routes = await routesStopsService.listRoutes();

            expect(routes).toHaveLength(2);
            expect(routes[0].versions).toBeDefined();
            expect(routes[0].startStop).toBeDefined();
            expect(routes[0].endStop).toBeDefined();
        });

        it('should search routes by name', async () => {
            const routes = await routesStopsService.listRoutes('Route A');

            expect(routes).toHaveLength(1);
            expect(routes[0].routeName).toBe('Route A');
        });
    });

    describe('Routes - getRouteById', () => {
        let startStop: any;
        let endStop: any;

        beforeEach(async () => {
            const uniqueId = Date.now() + Math.random();
            startStop = await routesStopsService.createStop({ stopName: 'Start', stopCode: `START-GR-${uniqueId}` });
            endStop = await routesStopsService.createStop({ stopName: 'End', stopCode: `END-GR-${uniqueId}` });
        });

        it('should get route by ID', async () => {
            const created = await routesStopsService.createRoute({
                routeName: 'Test Route',
                startStopId: startStop.id,
                endStopId: endStop.id,
            });

            const route = await routesStopsService.getRouteById(created.id);

            expect(route.id).toBe(created.id);
            expect(route.startStop).toBeDefined();
            expect(route.endStop).toBeDefined();
        });

        it('should throw NotFoundError for non-existent route', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                routesStopsService.getRouteById(fakeId)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('Routes - getRouteVersions', () => {
        let route: any;
        let stop1: any;
        let stop2: any;

        beforeEach(async () => {
            stop1 = await routesStopsService.createStop({ stopName: 'Stop 1', stopCode: 'S1' });
            stop2 = await routesStopsService.createStop({ stopName: 'Stop 2', stopCode: 'S2' });

            route = await routesStopsService.createRoute({
                routeName: 'Versioned Route',
                startStopId: stop1.id,
                endStopId: stop2.id,
            });
        });

        it('should get route versions', async () => {
            const versions = await routesStopsService.getRouteVersions(route.id);

            expect(versions).toHaveLength(1);
            expect(versions[0].versionNumber).toBe(1);
            expect(versions[0].routeStops).toBeDefined();
        });
    });

    describe('Routes - createNewRouteVersion', () => {
        let route: any;
        let stop1: any;
        let stop2: any;
        let stop3: any;

        beforeEach(async () => {
            const uniqueId = Date.now() + Math.random();
            stop1 = await routesStopsService.createStop({ stopName: 'Stop 1', stopCode: `S1-NRV-${uniqueId}` });
            stop2 = await routesStopsService.createStop({ stopName: 'Stop 2', stopCode: `S2-NRV-${uniqueId}` });
            stop3 = await routesStopsService.createStop({ stopName: 'Stop 3', stopCode: `S3-NRV-${uniqueId}` });

            route = await routesStopsService.createRoute({
                routeName: 'Versioned Route',
                startStopId: stop1.id,
                endStopId: stop3.id,
            });
        });

        it('should create new version and deactivate old version', async () => {
            const newVersion = await routesStopsService.createNewRouteVersion(route.id, {
                routeStops: [
                    { stopId: stop1.id, sequenceNumber: 1, estimatedMinutes: 0, distanceKm: 0 },
                    { stopId: stop2.id, sequenceNumber: 2, estimatedMinutes: 15, distanceKm: 10 },
                    { stopId: stop3.id, sequenceNumber: 3, estimatedMinutes: 30, distanceKm: 20 },
                ],
            }, adminUser.id);

            expect(newVersion.versionNumber).toBe(2);
            expect(newVersion.isActive).toBe(true);

            // Old version should be inactive
            const oldVersion = await prisma.routeVersion.findFirst({
                where: { routeId: route.id, versionNumber: 1 },
            });
            expect(oldVersion!.isActive).toBe(false);
            expect(oldVersion!.effectiveUntil).not.toBeNull();
        });

        it('should copy route stops from previous version if not provided', async () => {
            // Add stops to version 1
            const version1 = await prisma.routeVersion.findFirst({
                where: { routeId: route.id, versionNumber: 1 },
            });

            await prisma.routeStop.create({
                data: {
                    versionId: version1!.id,
                    stopId: stop1.id,
                    sequenceNumber: 1,
                    estimatedMinutes: 0,
                    distanceKm: 0,
                },
            });

            // Create version 2 without specifying stops
            const newVersion = await routesStopsService.createNewRouteVersion(route.id, {}, adminUser.id);

            // Should have copied stops
            const routeStops = await prisma.routeStop.findMany({
                where: { versionId: newVersion.id },
            });
            expect(routeStops).toHaveLength(1);
        });
    });

    describe('Routes - updateRoute', () => {
        let route: any;
        let stop1: any;
        let stop2: any;

        beforeEach(async () => {
            const uniqueId = Date.now() + Math.random();
            stop1 = await routesStopsService.createStop({ stopName: 'Stop 1', stopCode: `S1-UR-${uniqueId}` });
            stop2 = await routesStopsService.createStop({ stopName: 'Stop 2', stopCode: `S2-UR-${uniqueId}` });

            route = await routesStopsService.createRoute({
                routeName: 'Original Name',
                startStopId: stop1.id,
                endStopId: stop2.id,
            });
        });

        it('should update route fields', async () => {
            const updated = await routesStopsService.updateRoute(route.id, {
                routeName: 'Updated Name',
                description: 'New description',
            });

            expect(updated.routeName).toBe('Updated Name');
            expect(updated.description).toBe('New description');
        });
    });

    describe('Routes - deleteRoute', () => {
        let route: any;
        let stop1: any;
        let stop2: any;

        beforeEach(async () => {
            const uniqueId = Date.now() + Math.random();
            stop1 = await routesStopsService.createStop({ stopName: 'Stop 1', stopCode: `S1-DR-${uniqueId}` });
            stop2 = await routesStopsService.createStop({ stopName: 'Stop 2', stopCode: `S2-DR-${uniqueId}` });

            route = await routesStopsService.createRoute({
                routeName: 'To Delete',
                startStopId: stop1.id,
                endStopId: stop2.id,
            });
        });

        it('should soft-delete a route', async () => {
            const deleted = await routesStopsService.deleteRoute(route.id);

            expect(deleted.deletedAt).not.toBeNull();
        });
    });

    describe('Route Stops - addRouteStop', () => {
        let route: any;
        let version: any;
        let stop1: any;
        let stop2: any;

        beforeEach(async () => {
            const uniqueId = Date.now() + Math.random();
            stop1 = await routesStopsService.createStop({ stopName: 'Stop 1', stopCode: `S1-ARS-${uniqueId}` });
            stop2 = await routesStopsService.createStop({ stopName: 'Stop 2', stopCode: `S2-ARS-${uniqueId}` });

            route = await routesStopsService.createRoute({
                routeName: 'Test Route',
                startStopId: stop1.id,
                endStopId: stop2.id,
            });

            // Create inactive version for testing
            version = await prisma.routeVersion.create({
                data: {
                    routeId: route.id,
                    versionNumber: 2,
                    isActive: false,
                },
            });
        });

        it('should add route stop to inactive version', async () => {
            const routeStop = await routesStopsService.addRouteStop(version.id, {
                stopId: stop1.id,
                sequenceNumber: 1,
                estimatedMinutes: 0,
                distanceKm: 0,
            });

            expect(routeStop).toBeDefined();
            expect(routeStop.versionId).toBe(version.id);
            expect(routeStop.stopId).toBe(stop1.id);
        });

        it('should throw BadRequestError when adding to active version', async () => {
            const activeVersion = await prisma.routeVersion.findFirst({
                where: { routeId: route.id, isActive: true },
            });

            await expect(
                routesStopsService.addRouteStop(activeVersion!.id, {
                    stopId: stop1.id,
                    sequenceNumber: 1,
                    estimatedMinutes: 0,
                    distanceKm: 0,
                })
            ).rejects.toThrow(BadRequestError);
        });
    });
});
