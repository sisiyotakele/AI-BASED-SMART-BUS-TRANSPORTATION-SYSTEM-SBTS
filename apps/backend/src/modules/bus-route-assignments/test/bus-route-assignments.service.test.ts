import { prismaTest, resetDatabase } from '@/common/test-utils/test-db';
import * as assignmentService from '../bus-route-assignments.service';
import { NotFoundError } from '@/common/errors';
import { createUser, createBus, createTerminal, createStop, createRoute } from '@/common/test-utils/factories';

describe('Bus Route Assignments Service', () => {
    let adminUser: any;
    let terminal: any;
    let bus1: any;
    let bus2: any;
    let route1: any;
    let route2: any;

    beforeEach(async () => {
        await resetDatabase();

        adminUser = await createUser({ email: `admin_${Date.now()}@test.com` });
        terminal = await createTerminal({ terminalName: 'Test Terminal' });

        bus1 = await createBus({
            plateNumber: `BUS-001-${Date.now()}`,
            model: 'Test Model',
            capacity: 50,
            terminalId: terminal.id
        });

        bus2 = await createBus({
            plateNumber: `BUS-002-${Date.now()}`,
            model: 'Test Model',
            capacity: 50,
            terminalId: terminal.id
        });

        // Create stops first (required for routes)
        const stop1 = await createStop({ stopName: 'Stop 1', stopCode: `S1-${Date.now()}` });
        const stop2 = await createStop({ stopName: 'Stop 2', stopCode: `S2-${Date.now()}` });

        route1 = await createRoute({
            routeName: 'Route 1',
            startStopId: stop1.id,
            endStopId: stop2.id
        });

        const stop3 = await createStop({ stopName: 'Stop 3', stopCode: `S3-${Date.now()}` });
        const stop4 = await createStop({ stopName: 'Stop 4', stopCode: `S4-${Date.now()}` });

        route2 = await createRoute({
            routeName: 'Route 2',
            startStopId: stop3.id,
            endStopId: stop4.id
        });
    });

    describe('createAssignment', () => {
        it('should create an assignment with valid data', async () => {
            const assignmentData = {
                busId: bus1.id,
                routeId: route1.id,
                assignedDate: new Date('2026-08-01'),
                endDate: new Date('2026-12-31'),
            };

            const assignment = await assignmentService.createAssignment(assignmentData, adminUser.id);

            expect(assignment).toBeDefined();
            expect(assignment.busId).toBe(bus1.id);
            expect(assignment.routeId).toBe(route1.id);
            expect(assignment.isActive).toBe(true);
            expect(assignment.bus).toBeDefined();
            expect(assignment.route).toBeDefined();
            expect(assignment.bus.plateNumber).toContain('BUS-001');
            expect(assignment.route.routeName).toBe('Route 1');
        });

        it('should create an assignment without end date', async () => {
            const assignmentData = {
                busId: bus1.id,
                routeId: route1.id,
                assignedDate: new Date('2026-08-01'),
            };

            const assignment = await assignmentService.createAssignment(assignmentData);

            expect(assignment).toBeDefined();
            expect(assignment.endDate).toBeNull();
            expect(assignment.isActive).toBe(true);
        });

        it('should create multiple assignments for different buses', async () => {
            const assignment1 = await assignmentService.createAssignment({
                busId: bus1.id,
                routeId: route1.id,
                assignedDate: new Date('2026-08-01'),
            });

            const assignment2 = await assignmentService.createAssignment({
                busId: bus2.id,
                routeId: route2.id,
                assignedDate: new Date('2026-08-01'),
            });

            expect(assignment1.busId).toBe(bus1.id);
            expect(assignment2.busId).toBe(bus2.id);
        });

        it('should allow same bus on different routes (sequential)', async () => {
            const assignment1 = await assignmentService.createAssignment({
                busId: bus1.id,
                routeId: route1.id,
                assignedDate: new Date('2026-08-01'),
                endDate: new Date('2026-08-31'),
            });

            await assignmentService.deactivateAssignment(assignment1.id);

            const assignment2 = await assignmentService.createAssignment({
                busId: bus1.id,
                routeId: route2.id,
                assignedDate: new Date('2026-09-01'),
            });

            expect(assignment1.routeId).toBe(route1.id);
            expect(assignment2.routeId).toBe(route2.id);
            expect(assignment2.isActive).toBe(true);
        });
    });

    describe('listAssignments', () => {
        beforeEach(async () => {
            await assignmentService.createAssignment({
                busId: bus1.id,
                routeId: route1.id,
                assignedDate: new Date('2026-08-01'),
            });

            await assignmentService.createAssignment({
                busId: bus2.id,
                routeId: route2.id,
                assignedDate: new Date('2026-08-02'),
            });

            await assignmentService.createAssignment({
                busId: bus1.id,
                routeId: route2.id,
                assignedDate: new Date('2026-08-03'),
            });
        });

        it('should list all assignments', async () => {
            const assignments = await assignmentService.listAssignments();

            expect(assignments).toHaveLength(3);
            expect(assignments[0].bus).toBeDefined();
            expect(assignments[0].route).toBeDefined();
        });

        it('should list assignments ordered by assigned date (desc)', async () => {
            const assignments = await assignmentService.listAssignments();

            expect(assignments[0].assignedDate >= assignments[1].assignedDate).toBe(true);
            expect(assignments[1].assignedDate >= assignments[2].assignedDate).toBe(true);
        });

        it('should filter assignments by bus', async () => {
            const assignments = await assignmentService.listAssignments({ busId: bus1.id });

            expect(assignments).toHaveLength(2);
            expect(assignments.every(a => a.busId === bus1.id)).toBe(true);
        });

        it('should not return soft-deleted assignments', async () => {
            const assignment = await assignmentService.createAssignment({
                busId: bus1.id,
                routeId: route1.id,
                assignedDate: new Date('2026-08-10'),
            });

            await assignmentService.deleteAssignment(assignment.id);

            const assignments = await assignmentService.listAssignments();
            expect(assignments.find(a => a.id === assignment.id)).toBeUndefined();
        });
    });

    describe('getAssignmentById', () => {
        it('should get assignment by ID', async () => {
            const created = await assignmentService.createAssignment({
                busId: bus1.id,
                routeId: route1.id,
                assignedDate: new Date('2026-08-01'),
            });

            const assignment = await assignmentService.getAssignmentById(created.id);

            expect(assignment).toBeDefined();
            expect(assignment.id).toBe(created.id);
            expect(assignment.bus).toBeDefined();
            expect(assignment.route).toBeDefined();
        });

        it('should throw NotFoundError for non-existent assignment', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                assignmentService.getAssignmentById(fakeId)
            ).rejects.toThrow(NotFoundError);
        });

        it('should throw NotFoundError for soft-deleted assignment', async () => {
            const assignment = await assignmentService.createAssignment({
                busId: bus1.id,
                routeId: route1.id,
                assignedDate: new Date('2026-08-01'),
            });

            await assignmentService.deleteAssignment(assignment.id);

            await expect(
                assignmentService.getAssignmentById(assignment.id)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('deactivateAssignment', () => {
        it('should deactivate an active assignment', async () => {
            const assignment = await assignmentService.createAssignment({
                busId: bus1.id,
                routeId: route1.id,
                assignedDate: new Date('2026-08-01'),
            });

            expect(assignment.isActive).toBe(true);

            const deactivated = await assignmentService.deactivateAssignment(assignment.id);

            expect(deactivated.isActive).toBe(false);
            expect(deactivated.endDate).toBeInstanceOf(Date);
        });

        it('should set custom end date when deactivating', async () => {
            const assignment = await assignmentService.createAssignment({
                busId: bus1.id,
                routeId: route1.id,
                assignedDate: new Date('2026-08-01'),
            });

            const customEndDate = new Date('2026-08-31');
            const deactivated = await assignmentService.deactivateAssignment(assignment.id, {
                endDate: customEndDate,
            });

            expect(deactivated.isActive).toBe(false);
            expect(deactivated.endDate?.toISOString()).toBe(customEndDate.toISOString());
        });

        it('should throw NotFoundError when deactivating non-existent assignment', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                assignmentService.deactivateAssignment(fakeId)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('deleteAssignment', () => {
        it('should soft-delete an assignment', async () => {
            const assignment = await assignmentService.createAssignment({
                busId: bus1.id,
                routeId: route1.id,
                assignedDate: new Date('2026-08-01'),
            });

            const deleted = await assignmentService.deleteAssignment(assignment.id);

            expect(deleted.deletedAt).not.toBeNull();
            expect(deleted.deletedAt).toBeInstanceOf(Date);

            const assignments = await assignmentService.listAssignments();
            expect(assignments.find(a => a.id === assignment.id)).toBeUndefined();
        });

        it('should throw NotFoundError when deleting non-existent assignment', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                assignmentService.deleteAssignment(fakeId)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('Assignment Lifecycle', () => {
        it('should handle complete assignment lifecycle', async () => {
            // 1. Create active assignment
            const assignment = await assignmentService.createAssignment({
                busId: bus1.id,
                routeId: route1.id,
                assignedDate: new Date('2026-08-01'),
            });

            expect(assignment.isActive).toBe(true);
            expect(assignment.endDate).toBeNull();

            // 2. Deactivate assignment
            const deactivated = await assignmentService.deactivateAssignment(assignment.id, {
                endDate: new Date('2026-08-31'),
            });

            expect(deactivated.isActive).toBe(false);
            expect(deactivated.endDate).not.toBeNull();

            // 3. Assignment still visible in list
            const assignments = await assignmentService.listAssignments();
            expect(assignments.find(a => a.id === assignment.id)).toBeDefined();

            // 4. Soft delete assignment
            await assignmentService.deleteAssignment(assignment.id);

            // 5. Assignment no longer visible
            const afterDelete = await assignmentService.listAssignments();
            expect(afterDelete.find(a => a.id === assignment.id)).toBeUndefined();
        });
    });
});
