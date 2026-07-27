import { PrismaClient } from '@prisma/client';
import { NotFoundError, ConflictError } from '@/common/errors';
import { logger } from '@/common/logger';
import * as repository from './terminals.repository';

// Allow prisma client to be injected for testing
export function setPrismaClient(client: PrismaClient) {
  repository.setPrismaClient(client);
}

export async function createTerminal(data: any, actorId?: string) {
  try {
    const terminal = await repository.createTerminal(data);
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
  return repository.findTerminals(where);
}

export async function getTerminalById(id: string) {
  const terminal = await repository.findTerminalById(id);
  if (!terminal) throw new NotFoundError('Terminal not found', 'TERMINAL_NOT_FOUND');
  return terminal;
}

export async function updateTerminal(id: string, data: any) {
  await getTerminalById(id);
  try {
    const terminal = await repository.updateTerminal(id, data);
    logger.info('Terminal updated', { terminalId: id });
    return terminal;
  } catch (e: any) {
    if (e.code === 'P2002') throw new ConflictError('Terminal name already exists', 'TERMINAL_NAME_EXISTS');
    throw e;
  }
}

export async function deleteTerminal(id: string, _actorId?: string) {
  await getTerminalById(id);
  const terminal = await repository.softDeleteTerminal(id);
  logger.info('Terminal soft-deleted', { terminalId: id });
  return terminal;
}
