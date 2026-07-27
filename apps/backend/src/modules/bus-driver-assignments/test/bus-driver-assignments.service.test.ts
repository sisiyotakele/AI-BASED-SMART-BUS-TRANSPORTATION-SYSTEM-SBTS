import { prismaTest, resetDatabase } from '@/common/test-utils/test-db';
import * as assignmentService from '@/modules/bus-driver-assignments/bus-driver-assignments.service';
import { BadRequestError, ConflictError } from '@/common/errors';
import { createTerminal, createBus, createUser, createShift } from '@/common/test-utils/factories';

describe('Bus-Driver Assignment Service', () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  async function setupAssignmentDeps() {
    const terminal = await createTerminal();
    const bus = await createBus({ terminalId: terminal.id, maintenanceStatus: 'operational' });
    const driver = await createUser({
      licenseNumber: 'LIC123',
      licenseExpiry: new Date(Date.now() + 86400000),
    });
    const shift = await createShift({ driverId: driver.id });
    return { bus, driver, shift };
  }

  describe('createAssignment', () => {
    it('should create assignment when all checks pass', async () => {
      const { bus, driver, shift } = await setupAssignmentDeps();
      const date = new Date();
      date.setHours(0, 0, 0, 0);

      const assignment = await assignmentService.createAssignment({
        busId: bus.id,
        shiftId: shift.id,
        assignedDate: date,
        status: 'active',
      });

      expect(assignment.busId).toBe(bus.id);
      expect(assignment.shiftId).toBe(shift.id);
    });

    it('should reject if bus is in maintenance', async () => {
      const { bus, shift } = await setupAssignmentDeps();
      await prismaTest.bus.update({ where: { id: bus.id }, data: { maintenanceStatus: 'in_maintenance' } });

      await expect(assignmentService.createAssignment({
        busId: bus.id,
        shiftId: shift.id,
        assignedDate: new Date(),
        status: 'active',
      })).rejects.toThrow(BadRequestError);
    });

    it('should reject if driver license expired', async () => {
      const { bus, driver, shift } = await setupAssignmentDeps();
      await prismaTest.user.update({
        where: { id: driver.id },
        data: { licenseExpiry: new Date(Date.now() - 86400000) },
      });

      await expect(assignmentService.createAssignment({
        busId: bus.id,
        shiftId: shift.id,
        assignedDate: new Date(),
        status: 'active',
      })).rejects.toThrow(BadRequestError);
    });

    it('should reject bus double-booking on same date', async () => {
      const { bus, driver, shift } = await setupAssignmentDeps();
      const date = new Date();
      date.setHours(0, 0, 0, 0);

      await assignmentService.createAssignment({
        busId: bus.id, shiftId: shift.id, assignedDate: date, status: 'active',
      });

      const driver2 = await createUser({ licenseNumber: 'LIC456', licenseExpiry: new Date(Date.now() + 86400000) });
      const shift2 = await createShift({ driverId: driver2.id });

      await expect(assignmentService.createAssignment({
        busId: bus.id, shiftId: shift2.id, assignedDate: date, status: 'active',
      })).rejects.toThrow(ConflictError);
    });

    it('should reject shift double-booking on same date', async () => {
      const { bus, driver, shift } = await setupAssignmentDeps();
      const date = new Date();
      date.setHours(0, 0, 0, 0);

      await assignmentService.createAssignment({
        busId: bus.id, shiftId: shift.id, assignedDate: date, status: 'active',
      });

      const bus2 = await createBus();

      await expect(assignmentService.createAssignment({
        busId: bus2.id, shiftId: shift.id, assignedDate: date, status: 'active',
      })).rejects.toThrow(ConflictError);
    });
  });
});
