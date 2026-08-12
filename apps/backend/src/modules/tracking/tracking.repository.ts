import { prisma } from '@/prisma/client';

// ============================================================
// BUS QUERIES
// ============================================================

export async function findBusById(busId: string) {
    return prisma.bus.findUnique({
        where: { id: busId },
        select: { id: true, plateNumber: true },
    });
}

export async function findBusWithDetails(busId: string) {
    return prisma.bus.findUnique({
        where: { id: busId },
        select: {
            id: true,
            plateNumber: true,
            maintenanceStatus: true,
        },
    });
}

export async function findAllActiveBuses() {
    return prisma.bus.findMany({
        where: {
            maintenanceStatus: 'operational',
            deletedAt: null,
        },
        select: {
            id: true,
            plateNumber: true,
            maintenanceStatus: true,
        },
    });
}
