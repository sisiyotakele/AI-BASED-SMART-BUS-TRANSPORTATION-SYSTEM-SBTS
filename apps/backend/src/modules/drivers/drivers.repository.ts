import { prisma as defaultPrisma } from '@/prisma/client';

// Allow prisma client to be injected for testing
let prisma = defaultPrisma;

export function setPrismaClient(client: any) {
    prisma = client;
}

// ============================================================
// ROLE QUERIES
// ============================================================

export async function findRoleByName(roleName: string) {
    return prisma.role.findFirst({
        where: { roleName, deletedAt: null }
    });
}

// ============================================================
// DRIVER (USER) QUERIES
// ============================================================

export async function createDriver(data: any) {
    return prisma.user.create({ data });
}

export async function findDrivers(where: any) {
    return prisma.user.findMany({
        where,
        orderBy: { fullName: 'asc' }
    });
}

export async function findDriverById(id: string) {
    return prisma.user.findFirst({
        where: { id, deletedAt: null, licenseNumber: { not: null } }
    });
}

export async function updateDriver(id: string, data: any) {
    return prisma.user.update({
        where: { id },
        data
    });
}

export async function softDeleteDriver(id: string, actorId?: string) {
    return prisma.user.update({
        where: { id },
        data: {
            deletedAt: new Date(),
            ...(actorId && { deletedById: actorId })
        },
    });
}
