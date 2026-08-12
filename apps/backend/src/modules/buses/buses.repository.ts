import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '@/prisma/client';

// Allow prisma client to be injected for testing
let prisma: PrismaClient = defaultPrisma;

export function setPrismaClient(client: PrismaClient) {
    prisma = client;
}

// ============================================================
// BUS QUERIES
// ============================================================

export async function createBus(data: any) {
    return prisma.bus.create({ data });
}

export async function findBuses(where: any) {
    return prisma.bus.findMany({
        where,
        orderBy: { plateNumber: 'asc' }
    });
}

export async function findBusById(id: string) {
    return prisma.bus.findFirst({
        where: { id, deletedAt: null }
    });
}

export async function updateBus(id: string, data: any) {
    return prisma.bus.update({
        where: { id },
        data
    });
}

export async function softDeleteBus(id: string) {
    return prisma.bus.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
}
