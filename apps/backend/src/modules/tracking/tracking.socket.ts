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

                // Auto Proximity Detection: Check if bus is approaching nearby stations
                checkAndBroadcastProximity(io, location.busId, location.plateNumber, location.latitude, location.longitude);

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

/**
 * Key transit stations in Addis Ababa for proximity detection
 */
const TRANSIT_STATIONS = [
    { id: 'st-megenagna', name: 'Megenagna Station', lat: 9.0215, lon: 38.7989 },
    { id: 'st-ayat', name: 'Ayat Station', lat: 9.0345, lon: 38.8650 },
    { id: 'st-cmc', name: 'CMC Michael Station', lat: 9.0265, lon: 38.8310 },
    { id: 'st-mexico', name: 'Mexico Square', lat: 9.0105, lon: 38.7425 },
    { id: 'st-stadium', name: 'Stadium Hub', lat: 9.0135, lon: 38.7562 },
    { id: 'st-atlas', name: 'Atlas Station', lat: 9.0025, lon: 38.7735 },
    { id: 'st-medhanealem', name: 'Medhanealem Station', lat: 8.9950, lon: 38.7865 },
    { id: 'st-airport', name: 'Bole Airport Terminal', lat: 8.9805, lon: 38.7995 },
    { id: 'st-torhailoch', name: 'Tor Hailoch Station', lat: 9.0125, lon: 38.7230 },
    { id: 'st-sarbet', name: 'Sarbet Station', lat: 8.9985, lon: 38.7345 },
    { id: 'st-piassa', name: 'Piazza Station', lat: 9.0355, lon: 38.7515 },
];

// In-memory cooldown cache to prevent duplicate alerts (busId:stationId -> timestamp)
const proximityAlertCooldowns = new Map<string, number>();

/**
 * Haversine formula to compute distance in meters between two lat/long points
 */
function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Automatically check proximity to transit stations and broadcast alerts
 */
function checkAndBroadcastProximity(
    io: SocketIOServer,
    busId: string,
    plateNumber: string | undefined,
    busLat: number,
    busLon: number
) {
    const now = Date.now();
    const PROXIMITY_THRESHOLD_METERS = 500; // Trigger alert when within 500m (~1-2 mins arrival)
    const COOLDOWN_MS = 3 * 60 * 1000; // 3 minutes cooldown per station-bus pair

    for (const station of TRANSIT_STATIONS) {
        const distance = getDistanceMeters(busLat, busLon, station.lat, station.lon);
        const cooldownKey = `${busId}:${station.id}`;
        const lastAlertTime = proximityAlertCooldowns.get(cooldownKey) || 0;

        if (distance <= PROXIMITY_THRESHOLD_METERS && now - lastAlertTime > COOLDOWN_MS) {
            proximityAlertCooldowns.set(cooldownKey, now);

            const busDisplay = plateNumber || busId;
            const etaMinutes = Math.max(1, Math.round((distance / 400) * 1.5));

            const payload = {
                type: 'alert',
                title: `Bus ${busDisplay} → ${station.name}`,
                message: `${busDisplay} • Next: ${station.name} • ~${etaMinutes} min left`,
                data: {
                    busId,
                    stationId: station.id,
                    stationName: station.name,
                    distance: Math.round(distance),
                    etaMinutes,
                    timestamp: new Date().toISOString(),
                },
                timestamp: new Date().toISOString(),
            };

            // Broadcast to all connected clients & tracking room
            io.emit(SocketEvent.NOTIFICATION, payload);
            logger.info('📢 Automatic proximity alert dispatched', {
                busId,
                station: station.name,
                distance: Math.round(distance),
            });
        }
    }
}
