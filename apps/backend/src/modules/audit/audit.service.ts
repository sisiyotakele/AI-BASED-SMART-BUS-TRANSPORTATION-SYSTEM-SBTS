import { Prisma } from '@prisma/client';
import * as repository from './audit.repository';

export function setPrismaClient(client: any) {
  repository.setPrismaClient(client);
}

export interface CreateAuditLogDto {
  userId?: string;
  action: string;
  entityName: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  description?: string;
  ipAddress?: string;
}

/**
 * Create a new audit log
 */
export async function createAuditLog(data: CreateAuditLogDto) {
  return repository.createAuditLog({
    userId: data.userId,
    action: data.action,
    entityName: data.entityName,
    entityId: data.entityId,
    oldValues: data.oldValues ? JSON.stringify(data.oldValues) : null,
    newValues: data.newValues ? JSON.stringify(data.newValues) : null,
    description: data.description,
    ipAddress: data.ipAddress,
  });
}

/**
 * Get all audit logs
 */
export async function getAllAuditLogs() {
  return repository.findAllAuditLogs();
}

/**
 * Get audit log by ID
 */
export async function getAuditLogById(id: string) {
  return repository.findAuditLogById(id);
}

/**
 * Get audit logs by user
 */
export async function getAuditLogsByUser(userId: string) {
  return repository.findAuditLogsByUser(userId);
}

/**
 * Get audit logs by entity
 */
export async function getAuditLogsByEntity(
  entityName: string,
  entityId?: string
) {
  return repository.findAuditLogsByEntity(entityName, entityId);
}

/**
 * Delete audit log
 */
export async function deleteAuditLog(id: string) {
  return repository.deleteAuditLog(id);
}

/**
 * Search audit logs
 */
export async function searchAuditLogs(filters: {
  userId?: string;
  action?: string;
  entityName?: string;
}) {
  const where: Prisma.AuditLogWhereInput = {};

  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.action) {
    where.action = {
      contains: filters.action,
      mode: 'insensitive',
    };
  }

  if (filters.entityName) {
    where.entityName = {
      contains: filters.entityName,
      mode: 'insensitive',
    };
  }

  return repository.searchAuditLogs(where);
}
