import { PrismaClient } from '@prisma/client';
import { prisma as defaultPrisma } from '@/prisma/client';

// Allow prisma client to be injected for testing
let prisma: PrismaClient = defaultPrisma;

export function setPrismaClient(client: PrismaClient) {
    prisma = client;
}

// ============================================================
// TERMINAL QUERIES
// ============================================================

export async function createTerminal(data: any) {
    return prisma.terminal.create({ data });
}

export async function findTerminals(where: any) {
    return prisma.terminal.findMany({
        where,
        orderBy: { terminalName: 'asc' }
    });
}

export async function findTerminalById(id: string) {
    return prisma.terminal.findFirst({
        where: { id, deletedAt: null }
    });
}

export async function updateTerminal(id: string, data: any) {
    return prisma.terminal.update({
        where: { id },
        data
    });
}

export async function softDeleteTerminal(id: string) {
    return prisma.terminal.update({
        where: { id },
        data: { deletedAt: new Date() },
    });
}
