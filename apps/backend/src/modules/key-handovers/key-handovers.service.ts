import { prisma as defaultPrisma } from '@/prisma/client';
import { NotFoundError, ConflictError, BadRequestError } from '@/common/errors';
import { logger } from '@/common/logger';

let prisma = defaultPrisma;

export function setPrismaClient(client: any) {
  prisma = client;
}

export async function createHandover(data: any, actorId?: string) {
  const handover = await prisma.keyHandover.create({
    data: {
      busId: data.busId,
      terminalId: data.terminalId,
      fromShiftId: data.fromShiftId,
      toShiftId: data.toShiftId,
      handoverTime: data.handoverTime,
      notes: data.notes,
      status: 'pending',
    },
    include: {
      bus: { select: { id: true, plateNumber: true } },
      terminal: { select: { id: true, terminalName: true } },
      fromShift: { include: { driver: { select: { id: true, fullName: true } } } },
      toShift: { include: { driver: { select: { id: true, fullName: true } } } },
    },
  });
  logger.info('Key handover created', { handoverId: handover.id });
  return handover;
}

export async function listHandovers(filters: { busId?: string; date?: Date } = {}) {
  const where: any = {};
  if (filters.busId) where.busId = filters.busId;
  if (filters.date) {
    const start = new Date(filters.date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(filters.date);
    end.setHours(23, 59, 59, 999);
    where.handoverTime = { gte: start, lte: end };
  }
  return prisma.keyHandover.findMany({
    where,
    include: {
      bus: { select: { id: true, plateNumber: true } },
      terminal: { select: { id: true, terminalName: true } },
      fromShift: { include: { driver: { select: { id: true, fullName: true } } } },
      toShift: { include: { driver: { select: { id: true, fullName: true } } } },
    },
    orderBy: { handoverTime: 'desc' },
  });
}

export async function getHandoverById(id: string) {
  const handover = await prisma.keyHandover.findFirst({
    where: { id },
    include: {
      bus: { select: { id: true, plateNumber: true } },
      terminal: { select: { id: true, terminalName: true } },
      fromShift: { include: { driver: { select: { id: true, fullName: true } } } },
      toShift: { include: { driver: { select: { id: true, fullName: true } } } },
    },
  });
  if (!handover) throw new NotFoundError('Key handover not found', 'HANDOVER_NOT_FOUND');
  return handover;
}

export async function confirmFrom(id: string) {
  const handover = await getHandoverById(id);
  if (handover.confirmedByFrom) throw new BadRequestError('Already confirmed by outgoing driver', 'ALREADY_CONFIRMED');

  const updated = await prisma.keyHandover.update({
    where: { id },
    data: { confirmedByFrom: true, status: handover.confirmedByTo ? 'confirmed' : 'pending' },
  });
  logger.info('Key handover confirmed by outgoing driver', { handoverId: id });
  return updated;
}

export async function confirmTo(id: string) {
  const handover = await getHandoverById(id);
  if (handover.confirmedByTo) throw new BadRequestError('Already confirmed by incoming driver', 'ALREADY_CONFIRMED');

  const updated = await prisma.keyHandover.update({
    where: { id },
    data: { confirmedByTo: true, status: handover.confirmedByFrom ? 'confirmed' : 'pending' },
  });
  logger.info('Key handover confirmed by incoming driver', { handoverId: id });
  return updated;
}
