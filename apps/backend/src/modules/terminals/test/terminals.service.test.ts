import { prisma } from '@/prisma/client';
import * as terminalService from '../terminals.service';
import { NotFoundError, ConflictError } from '@/common/errors';
import { createTestUser } from '@/common/test-utils/factories';

describe('Terminals Service', () => {
    let adminUser: any;

    beforeAll(async () => {
        adminUser = await createTestUser({ email: 'admin@test.com' });
    });

    afterEach(async () => {
        await prisma.terminal.deleteMany({});
    });

    describe('createTerminal', () => {
        it('should create a terminal with valid data', async () => {
            const terminalData = {
                terminalName: 'Central Terminal',
                address: '123 Main St, City',
                latitude: 9.0192,
                longitude: 38.7525,
                capacity: 50,
                facilities: 'Waiting area, Restrooms, Ticket booth',
            };

            const terminal = await terminalService.createTerminal(terminalData, adminUser.id);

            expect(terminal).toBeDefined();
            expect(terminal.terminalName).toBe('Central Terminal');
            expect(terminal.address).toBe('123 Main St, City');
            expect(terminal.latitude).toBeCloseTo(9.0192);
            expect(terminal.longitude).toBeCloseTo(38.7525);
            expect(terminal.capacity).toBe(50);
            expect(terminal.createdById).toBe(adminUser.id);
        });

        it('should create a terminal with minimal data', async () => {
            const terminalData = {
                terminalName: 'North Terminal',
            };

            const terminal = await terminalService.createTerminal(terminalData, adminUser.id);

            expect(terminal).toBeDefined();
            expect(terminal.terminalName).toBe('North Terminal');
            expect(terminal.address).toBeNull();
            expect(terminal.latitude).toBeNull();
            expect(terminal.longitude).toBeNull();
        });

        it('should throw ConflictError for duplicate terminal name', async () => {
            const terminalData = {
                terminalName: 'Duplicate Terminal',
                address: '456 Oak St',
            };

            await terminalService.createTerminal(terminalData, adminUser.id);

            await expect(
                terminalService.createTerminal(terminalData, adminUser.id)
            ).rejects.toThrow(ConflictError);

            await expect(
                terminalService.createTerminal(terminalData, adminUser.id)
            ).rejects.toThrow('Terminal name already exists');
        });
    });

    describe('listTerminals', () => {
        beforeEach(async () => {
            await terminalService.createTerminal({
                terminalName: 'Central Terminal',
                address: '123 Main St',
            }, adminUser.id);
            await terminalService.createTerminal({
                terminalName: 'North Terminal',
                address: '456 North Ave',
            }, adminUser.id);
            await terminalService.createTerminal({
                terminalName: 'South Terminal',
                address: '789 South Blvd',
            }, adminUser.id);
        });

        it('should list all terminals', async () => {
            const terminals = await terminalService.listTerminals();

            expect(terminals).toHaveLength(3);
            expect(terminals[0].terminalName).toBe('Central Terminal');
            expect(terminals[1].terminalName).toBe('North Terminal');
            expect(terminals[2].terminalName).toBe('South Terminal');
        });

        it('should search terminals by name', async () => {
            const terminals = await terminalService.listTerminals('North');

            expect(terminals).toHaveLength(1);
            expect(terminals[0].terminalName).toBe('North Terminal');
        });

        it('should search terminals by address', async () => {
            const terminals = await terminalService.listTerminals('Main');

            expect(terminals).toHaveLength(1);
            expect(terminals[0].address).toContain('Main');
        });

        it('should return empty array when no matches', async () => {
            const terminals = await terminalService.listTerminals('NonExistent');

            expect(terminals).toHaveLength(0);
        });

        it('should not return soft-deleted terminals', async () => {
            const terminal = await terminalService.createTerminal({
                terminalName: 'To Be Deleted',
            }, adminUser.id);

            await terminalService.deleteTerminal(terminal.id);

            const terminals = await terminalService.listTerminals();
            expect(terminals).toHaveLength(3); // Should still be 3, not 4
            expect(terminals.find(t => t.id === terminal.id)).toBeUndefined();
        });
    });

    describe('getTerminalById', () => {
        it('should get terminal by ID', async () => {
            const created = await terminalService.createTerminal({
                terminalName: 'Test Terminal',
                address: '100 Test St',
            }, adminUser.id);

            const terminal = await terminalService.getTerminalById(created.id);

            expect(terminal).toBeDefined();
            expect(terminal.id).toBe(created.id);
            expect(terminal.terminalName).toBe('Test Terminal');
        });

        it('should throw NotFoundError for non-existent terminal', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                terminalService.getTerminalById(fakeId)
            ).rejects.toThrow(NotFoundError);

            await expect(
                terminalService.getTerminalById(fakeId)
            ).rejects.toThrow('Terminal not found');
        });

        it('should throw NotFoundError for soft-deleted terminal', async () => {
            const created = await terminalService.createTerminal({
                terminalName: 'To Delete',
            }, adminUser.id);

            await terminalService.deleteTerminal(created.id);

            await expect(
                terminalService.getTerminalById(created.id)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('updateTerminal', () => {
        it('should update terminal fields', async () => {
            const created = await terminalService.createTerminal({
                terminalName: 'Original Name',
                address: 'Original Address',
            }, adminUser.id);

            const updated = await terminalService.updateTerminal(created.id, {
                terminalName: 'Updated Name',
                capacity: 100,
            });

            expect(updated.terminalName).toBe('Updated Name');
            expect(updated.capacity).toBe(100);
            expect(updated.address).toBe('Original Address'); // Unchanged
        });

        it('should throw NotFoundError when updating non-existent terminal', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                terminalService.updateTerminal(fakeId, { terminalName: 'New Name' })
            ).rejects.toThrow(NotFoundError);
        });

        it('should throw ConflictError when updating to duplicate name', async () => {
            await terminalService.createTerminal({
                terminalName: 'Terminal A',
            }, adminUser.id);

            const terminalB = await terminalService.createTerminal({
                terminalName: 'Terminal B',
            }, adminUser.id);

            await expect(
                terminalService.updateTerminal(terminalB.id, { terminalName: 'Terminal A' })
            ).rejects.toThrow(ConflictError);
        });
    });

    describe('deleteTerminal', () => {
        it('should soft-delete a terminal', async () => {
            const created = await terminalService.createTerminal({
                terminalName: 'To Delete',
            }, adminUser.id);

            const deleted = await terminalService.deleteTerminal(created.id);

            expect(deleted.deletedAt).not.toBeNull();
            expect(deleted.deletedAt).toBeInstanceOf(Date);

            // Should not appear in list
            const terminals = await terminalService.listTerminals();
            expect(terminals.find(t => t.id === created.id)).toBeUndefined();
        });

        it('should throw NotFoundError when deleting non-existent terminal', async () => {
            const fakeId = '00000000-0000-0000-0000-000000000000';

            await expect(
                terminalService.deleteTerminal(fakeId)
            ).rejects.toThrow(NotFoundError);
        });

        it('should throw NotFoundError when deleting already-deleted terminal', async () => {
            const created = await terminalService.createTerminal({
                terminalName: 'To Delete',
            }, adminUser.id);

            await terminalService.deleteTerminal(created.id);

            await expect(
                terminalService.deleteTerminal(created.id)
            ).rejects.toThrow(NotFoundError);
        });
    });

    describe('Edge Cases', () => {
        it('should handle terminals with coordinates at boundaries', async () => {
            const terminal = await terminalService.createTerminal({
                terminalName: 'Boundary Terminal',
                latitude: -90,
                longitude: 180,
            }, adminUser.id);

            expect(terminal.latitude).toBe(-90);
            expect(terminal.longitude).toBe(180);
        });

        it('should handle terminals with very long names', async () => {
            const longName = 'A'.repeat(255);
            const terminal = await terminalService.createTerminal({
                terminalName: longName,
            }, adminUser.id);

            expect(terminal.terminalName).toBe(longName);
            expect(terminal.terminalName).toHaveLength(255);
        });

        it('should handle search with special characters', async () => {
            await terminalService.createTerminal({
                terminalName: "O'Hare Terminal",
                address: '123 Main St',
            }, adminUser.id);

            const terminals = await terminalService.listTerminals("O'Hare");
            expect(terminals).toHaveLength(1);
        });
    });
});
