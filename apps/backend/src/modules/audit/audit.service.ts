import { AuditLog, Prisma } from '@prisma/client';
import { prisma } from '@/prisma/client';

export interface CreateAuditLogDto {
  userId?: string;
  action: string;
  entityName: string;
  entityId?: string;
  oldValues?: string;
  newValues?: string;
  description?: string;
  ipAddress?: string;
}

class AuditService {
  /**
   * Create a new audit log
 
  async createAuditLog(data: CreateAuditLogDto): Promise<AuditLog> {
    return prisma.auditLog.create({
      data,
    });
  }  */

  /**
   * Get all audit logs
   */
  async getAllAuditLogs(): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get audit log by ID
   */
  async getAuditLogById(id: string): Promise<AuditLog | null> {
    return prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });
  }

  /**
   * Get audit logs by user
   */
  async getAuditLogsByUser(userId: string): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: {
        userId,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Get audit logs by entity
   */
  async getAuditLogsByEntity(
    entityName: string,
    entityId?: string,
  ): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: {
        entityName,
        ...(entityId && { entityId }),
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Delete audit log
   */
  async deleteAuditLog(id: string): Promise<AuditLog> {
    return prisma.auditLog.delete({
      where: {
        id,
      },
    });
  }

  /**
   * Search audit logs
   */
  async searchAuditLogs(filters: {
    userId?: string;
    action?: string;
    entityName?: string;
  }): Promise<AuditLog[]> {
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

    return prisma.auditLog.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    }
    async createAuditLog(data: {
  userId?: string;
  action: string;
  entityName: string;
  entityId?: string;
  oldValues?: unknown;
  newValues?: unknown;
  description?: string;
  ipAddress?: string;
}) {
  return prisma.auditLog.create({
    data: {
      userId: data.userId,
      action: data.action,
      entityName: data.entityName,
      entityId: data.entityId,
      oldValues: data.oldValues
        ? JSON.stringify(data.oldValues)
        : null,
      newValues: data.newValues
        ? JSON.stringify(data.newValues)
        : null,
      description: data.description,
      ipAddress: data.ipAddress,
    },
  });
}
}

export const auditService = new AuditService();
export default auditService;