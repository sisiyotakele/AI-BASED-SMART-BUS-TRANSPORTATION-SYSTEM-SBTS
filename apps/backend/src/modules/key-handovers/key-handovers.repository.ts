import { prisma as defaultPrisma } from '@/prisma/client';

let prisma = defaultPrisma;

export function setPrismaClient(client: any) {
    prisma = client;
}

// ============================================================
// KEY HANDOVER QUERIES
// ============================================================

export async function createHandover(data: any) {
    return prisma.keyHandover.create({
        data,
        include: {
            bus: { select: { id: true, plateNumber: true } },
            terminal: { select: { id: true, terminalName: true } },
            fromShift: { include: { driver: { select: { id: true, fullName: true } } } },
            toShift: { include: { driver: { select: { id: true, fullName: true } } } },
        },
    });
}

export async function findHandovers(where: any) {
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

export async function findHandoverById(id: string) {
    return prisma.keyHandover.findFirst({
        where: { id },
        include: {
            bus: { select: { id: true, plateNumber: true } },
            terminal: { select: { id: true, terminalName: true } },
            fromShift: { include: { driver: { select: { id: true, fullName: true } } } },
            toShift: { include: { driver: { select: { id: true, fullName: true } } } },
        },
    });
}

export async function updateHandover(id: string, data: any) {
    return prisma.keyHandover.update({
        where: { id },
        data,
    });
}
