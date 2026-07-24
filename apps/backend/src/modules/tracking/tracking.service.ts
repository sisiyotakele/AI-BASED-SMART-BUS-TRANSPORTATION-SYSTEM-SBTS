import { prisma } from '@/prisma/client';
import { NotFoundError } from '@/common/errors';
import { logger } from '@/common/logger';

interface LocationUpdate {
  busId: string;
  latitude: number;
  longitude: number;
  speed?: number;
  heading?: number;
  timestamp: Date;
}

/**
 * Update bus location in real-time
 */
export async function updateBusLocation(data: LocationUpdate) {
  // Verify bus exists
  const bus = await prisma.bus.findUnique({
    where: { id: data.busId },
    select: { id: true, plateNumber: true },
  });

  if (!bus) {
    throw new NotFoundError('Bus not found', 'BUS_NOT_FOUND');
  }

  // Store location in database (you can create a BusLocation table if needed)
  // For now, we'll just validate and return the data

  logger.info('Bus location updated', {
    busId: data.busId,
    plateNumber: bus.plateNumber,
    latitude: data.latitude,
    longitude: data.longitude,
  });

  return {
    busId: data.busId,
    plateNumber: bus.plateNumber,
    latitude: data.latitude,
    longitude: data.longitude,
    speed: data.speed,
    heading: data.heading,
    timestamp: data.timestamp,
  };
}

/**
 * Get current location of a specific bus
 */
export async function getBusLocation(busId: string) {
  const bus = await prisma.bus.findUnique({
    where: { id: busId },
    select: {
      id: true,
      plateNumber: true,
      maintenanceStatus: true,
    },
  });

  if (!bus) {
    throw new NotFoundError('Bus not found', 'BUS_NOT_FOUND');
  }

  return {
    busId: bus.id,
    plateNumber: bus.plateNumber,
    maintenanceStatus: bus.maintenanceStatus,
    // In production, you'd fetch the latest location from a BusLocation table
    // For now, return basic bus info
  };
}

/**
 * Get locations of all active buses
 */
export async function getAllActiveBusLocations() {
  const buses = await prisma.bus.findMany({
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

  return buses.map(bus => ({
    busId: bus.id,
    plateNumber: bus.plateNumber,
    maintenanceStatus: bus.maintenanceStatus,
  }));
}
