import { Server as SocketIOServer } from 'socket.io';
import { logger } from '@/common/logger';
import * as trackingService from './tracking.service';
import { socketUtils, SocketEvent } from '@/common/socket';

/**
 * Initialize tracking-specific Socket.IO handlers
 */
export function initializeTrackingSocket(io: SocketIOServer) {
    io.on('connection', (socket) => {

        // Handle bus location updates from drivers/GPS devices
        socket.on('tracking:location:update', async (data) => {
            try {
                const { busId, latitude, longitude, speed, heading } = data;

                // Validate and store location
                const location = await trackingService.updateBusLocation({
                    busId,
                    latitude,
                    longitude,
                    speed,
                    heading,
                    timestamp: new Date(),
                });

                // Broadcast location to all subscribers
                socketUtils.broadcastBusLocation(busId, {
                    latitude: location.latitude,
                    longitude: location.longitude,
                    speed: location.speed,
                });

                // Also broadcast to tracking:all room
                io.to('tracking:all').emit(SocketEvent.BUS_LOCATION_UPDATE, {
                    busId: location.busId,
                    plateNumber: location.plateNumber,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    speed: location.speed,
                    heading: location.heading,
                    timestamp: location.timestamp,
                });

                logger.debug('Location update broadcasted', { busId, latitude, longitude });

            } catch (error: any) {
                logger.error('Failed to process location update', { error: error.message, data });
                socket.emit('tracking:error', {
                    message: 'Failed to update location',
                    error: error.message,
                });
            }
        });

        // Handle request for current bus location
        socket.on('tracking:location:get', async (busId: string, callback) => {
            try {
                const location = await trackingService.getBusLocation(busId);
                if (callback && typeof callback === 'function') {
                    callback({ success: true, data: location });
                }
            } catch (error: any) {
                logger.error('Failed to get bus location', { busId, error: error.message });
                if (callback && typeof callback === 'function') {
                    callback({ success: false, error: error.message });
                }
            }
        });

        // Handle request for all active bus locations
        socket.on('tracking:locations:getAll', async (callback) => {
            try {
                const locations = await trackingService.getAllActiveBusLocations();
                if (callback && typeof callback === 'function') {
                    callback({ success: true, data: locations });
                }
            } catch (error: any) {
                logger.error('Failed to get all bus locations', { error: error.message });
                if (callback && typeof callback === 'function') {
                    callback({ success: false, error: error.message });
                }
            }
        });
    });

    logger.info('✅ Tracking Socket.IO handlers initialized');
}
