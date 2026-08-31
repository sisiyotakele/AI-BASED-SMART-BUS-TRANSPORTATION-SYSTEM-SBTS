import { NotFoundError, BadRequestError } from '@/common/errors';
import { logger } from '@/common/logger';
import * as repository from './key-handovers.repository';
import { prisma } from '@/prisma/client';

export function setPrismaClient(client: any) {
  repository.setPrismaClient(client);
}

export async function createHandover(data: any, actorId?: string) {
  // Auto-resolve terminalId from bus if not provided
  let finalTerminalId = data.terminalId;
  if (!finalTerminalId && data.busId) {
    const bus = await prisma.bus.findUnique({ where: { id: data.busId } });
    finalTerminalId = bus?.terminalId;
    if (!finalTerminalId) {
      const anyTerminal = await prisma.terminal.findFirst();
      finalTerminalId = anyTerminal?.id;
    }
  }
  if (!finalTerminalId) {
    throw new BadRequestError('Could not determine terminal for this handover', 'TERMINAL_REQUIRED');
  }

  const handover = await repository.createHandover({
    busId: data.busId,
    terminalId: finalTerminalId,
    fromShiftId: data.fromShiftId || null,
    toShiftId: data.toShiftId || null,
    handoverTime: data.handoverTime || new Date(),
    notes: data.notes || null,
    status: 'pending',
    confirmedByFrom: true, // outgoing driver initiates = auto-confirms their side
  });

  // Automatically dispatch notification to the next driver
  if (data.toShiftId) {
    const shift = await prisma.shift.findUnique({ where: { id: data.toShiftId } });
    if (shift && shift.driverId) {
        await prisma.notification.create({
            data: {
                notificationType: 'key_handover',
                title: 'Key Handover Alert',
                message: `You have an incoming key handover awaiting your acceptance.`,
                recipients: {
                    create: { userId: shift.driverId }
                }
            }
        });
    }
  }

  logger.info('Key handover created', { handoverId: handover.id, actorId });
  return handover;
}

export async function listHandovers(filters: { busId?: string; date?: Date; driverId?: string; status?: string } = {}) {
  const where: any = {};
  if (filters.busId) where.busId = filters.busId;
  if (filters.status) where.status = filters.status;
  if (filters.date) {
    const start = new Date(filters.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filters.date);
    end.setHours(23, 59, 59, 999);
    where.handoverTime = { gte: start, lte: end };
  }
  // Filter by driver: show records where the driver is EITHER giving OR receiving
  if (filters.driverId) {
    where.OR = [
      { fromShift: { driverId: filters.driverId } },
      { toShift:   { driverId: filters.driverId } },
    ];
  }
  return repository.findHandovers(where);
}

export async function getHandoverById(id: string) {
  const handover = await repository.findHandoverById(id);
  if (!handover) throw new NotFoundError('Key handover not found', 'HANDOVER_NOT_FOUND');
  return handover;
}

/**
 * Get the next scheduled driver for a bus — used to auto-populate the handover form.
 * Finds the next BusDriverAssignment after the current one for the same bus.
 */
export async function getNextDriverForBus(busId: string, currentShiftId?: string, currentDriverId?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Find future/upcoming assignment for the same bus (excluding current shift and current driver)
  const nextAssignment = await prisma.busDriverAssignment.findFirst({
    where: {
      busId,
      deletedAt: null,
      status: 'active',
      ...(currentShiftId ? { shiftId: { not: currentShiftId } } : {}),
      shift: currentDriverId ? { driverId: { not: currentDriverId } } : undefined,
      assignedDate: { gte: today },
    },
    orderBy: { assignedDate: 'asc' },
    include: {
      shift: {
        include: {
          driver: { select: { id: true, fullName: true, email: true, phone: true } },
        },
      },
      bus: { select: { id: true, plateNumber: true } },
    },
  });

  if (!nextAssignment) return null;

  return {
    shiftId: nextAssignment.shiftId,
    driverId: nextAssignment.shift.driverId,
    driverName: nextAssignment.shift.driver.fullName,
    driverEmail: nextAssignment.shift.driver.email,
    shiftDate: nextAssignment.assignedDate,
    bus: nextAssignment.bus,
  };
}

export async function confirmFrom(id: string) {
  const handover = await getHandoverById(id);
  if (handover.confirmedByFrom) throw new BadRequestError('Already confirmed by outgoing driver', 'ALREADY_CONFIRMED');

  const isFullyConfirmed = handover.confirmedByTo;
  const updated = await repository.updateHandover(id, {
    confirmedByFrom: true,
    status: isFullyConfirmed ? 'confirmed' : 'pending',
  });

  if (isFullyConfirmed && handover.fromShiftId) {
    await repository.finishShiftAndAssignment(handover.fromShiftId);
    logger.info('Shift completed via Key Handover', { shiftId: handover.fromShiftId });
  }

  logger.info('Key handover confirmed by outgoing driver', { handoverId: id });
  return updated;
}

export async function confirmTo(id: string) {
  const handover = await getHandoverById(id);
  if (handover.confirmedByTo) throw new BadRequestError('Already confirmed by incoming driver', 'ALREADY_CONFIRMED');

  const isFullyConfirmed = handover.confirmedByFrom;
  const updated = await repository.updateHandover(id, {
    confirmedByTo: true,
    status: isFullyConfirmed ? 'confirmed' : 'pending',
  });

  if (isFullyConfirmed && handover.fromShiftId) {
    await repository.finishShiftAndAssignment(handover.fromShiftId);
    logger.info('Shift completed via Key Handover', { shiftId: handover.fromShiftId });
  }

  logger.info('Key handover confirmed by incoming driver', { handoverId: id });
  return updated;
}

export async function rejectHandover(id: string) {
  const handover = await getHandoverById(id);
  if (handover.status === 'confirmed') {
    throw new BadRequestError('Cannot reject an already confirmed handover', 'ALREADY_CONFIRMED');
  }
  const updated = await repository.updateHandover(id, { status: 'cancelled' });
  logger.info('Key handover rejected/cancelled', { handoverId: id });
  return updated;
}
