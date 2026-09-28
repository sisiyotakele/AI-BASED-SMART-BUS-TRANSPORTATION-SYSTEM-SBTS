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

export async function findAllLiveLocations() {
    return prisma.busLiveLocation.findMany({
        where: {
            trip: {
                status: 'in_progress'
            }
        },
        include: {
            bus: { select: { id: true, plateNumber: true, model: true, capacity: true } },
            driver: { select: { id: true, fullName: true, phone: true } },
            trip: {
                select: {
                    id: true,
                    version: {
                        select: {
                            route: { select: { id: true, routeName: true } }
                        }
                    }
                }
            }
        },
        orderBy: { recordedAt: 'desc' },
        // For the presentation, we want distinct by tripId so all active trips show up on the map
        // even if mock data assigned the same physical bus to multiple trips at once.
        distinct: ['tripId'],
    });
}
