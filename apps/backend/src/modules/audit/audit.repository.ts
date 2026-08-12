import { Prisma } from '@prisma/client';
import { prisma as defaultPrisma } from '@/prisma/client';

let prisma = defaultPrisma;

export function setPrismaClient(client: any) {
    prisma = client;
}

// ============================================================
// AUDIT LOG QUERIES
// ============================================================

export async function createAuditLog(data: {
    userId?: string;
    action: string;
    entityName: string;
    entityId?: string;
    oldValues?: string | null;
    newValues?: string | null;
    description?: string;
    ipAddress?: string;
}) {
    return prisma.auditLog.create({ data });
}

export async function findAllAuditLogs() {
    return prisma.auditLog.findMany({
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}

export async function findAuditLogById(id: string) {
    return prisma.auditLog.findUnique({
        where: { id },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
        },
    });
}

export async function findAuditLogsByUser(userId: string) {
    return prisma.auditLog.findMany({
        where: {
            userId,
        },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}

export async function findAuditLogsByEntity(
    entityName: string,
    entityId?: string
) {
    return prisma.auditLog.findMany({
        where: {
            entityName,
            ...(entityId && { entityId }),
        },
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}

export async function searchAuditLogs(where: Prisma.AuditLogWhereInput) {
    return prisma.auditLog.findMany({
        where,
        include: {
            user: {
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                },
            },
        },
        orderBy: {
            createdAt: 'desc',
        },
    });
}

export async function deleteAuditLog(id: string) {
    return prisma.auditLog.delete({
        where: { id },
    });
}
