import { prisma } from '@/prisma/client';
import { NotFoundError, ConflictError } from '@/common/errors';
import { logger } from '@/common/logger';

export async function createTerminal(data: any, actorId?: string) {
  try {
    const terminal = await prisma.terminal.create({ data: { ...data, createdById: actorId } });
    logger.info('Terminal created', { terminalId: terminal.id });
    return terminal;
  } catch (e: any) {
    if (e.code === 'P2002') throw new ConflictError('Terminal name already exists', 'TERMINAL_NAME_EXISTS');
    throw e;
  }
}

export async function listTerminals(search?: string) {
  const where: any = { deletedAt: null };
  if (search) {
    where.OR = [
      { terminalName: { contains: search, mode: 'insensitive' } },
      { address: { contains: search, mode: 'insensitive' } },
    ];
  }
  return prisma.terminal.findMany({ where, orderBy: { terminalName: 'asc' } });
}

export async function getTerminalById(id: string) {
  const terminal = await prisma.terminal.findFirst({ where: { id, deletedAt: null } });
  if (!terminal) throw new NotFoundError('Terminal not found', 'TERMINAL_NOT_FOUND');
  return terminal;
}

export async function updateTerminal(id: string, data: any) {
  await getTerminalById(id);
  try {
    const terminal = await prisma.terminal.update({ where: { id }, data });
    logger.info('Terminal updated', { terminalId: id });
    return terminal;
  } catch (e: any) {
    if (e.code === 'P2002') throw new ConflictError('Terminal name already exists', 'TERMINAL_NAME_EXISTS');
    throw e;
  }
}

export async function deleteTerminal(id: string, _actorId?: string) {
  await getTerminalById(id);
  const terminal = await prisma.terminal.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
  logger.info('Terminal soft-deleted', { terminalId: id });
  return terminal;
}
