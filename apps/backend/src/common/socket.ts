/**
 * Socket.io Utility Functions
 * High-level utilities for real-time communication
 */

import { SocketServer } from '@/config/socket';
import { logger } from './logger';

/**
 * Socket Event Types
 */
export enum SocketEvent {
    // Bus tracking events
    BUS_LOCATION_UPDATE = 'bus:location:update',
    BUS_STATUS_CHANGE = 'bus:status:change',

    // Trip events
    TRIP_STARTED = 'trip:started',
    TRIP_UPDATED = 'trip:updated',
    TRIP_COMPLETED = 'trip:completed',
    TRIP_CANCELLED = 'trip:cancelled',

    // Route events
    ROUTE_UPDATED = 'route:updated',

    // Notification events
    NOTIFICATION = 'notification',

    // Incident events
    INCIDENT_CREATED = 'incident:created',
    INCIDENT_UPDATED = 'incident:updated',
    INCIDENT_RESOLVED = 'incident:resolved',

    // Maintenance events
    MAINTENANCE_SCHEDULED = 'maintenance:scheduled',
    MAINTENANCE_COMPLETED = 'maintenance:completed',
}

/**
 * Socket utilities for emitting events
 */
export const socketUtils = {
    /**
     * Send notification to specific user
     */
    notifyUser(userId: string, message: string, data?: any): void {
        try {
            SocketServer.emitToUser(userId, SocketEvent.NOTIFICATION, {
                message,
                data,
                timestamp: new Date().toISOString(),
            });
            logger.debug('Notification sent to user', { userId, message });
        } catch (error) {
            logger.error('Failed to send user notification', { userId, error });
        }
    },

    /**
     * Broadcast bus location update
     */
    broadcastBusLocation(busId: string, location: { latitude: number; longitude: number; speed?: number }): void {
        try {
            SocketServer.emitToBus(busId, SocketEvent.BUS_LOCATION_UPDATE, {
                busId,
                location,
                timestamp: new Date().toISOString(),
            });
            logger.debug('Bus location broadcasted', { busId, location });
        } catch (error) {
            logger.error('Failed to broadcast bus location', { busId, error });
        }
    },

    /**
     * Broadcast bus status change
     */
    broadcastBusStatus(busId: string, status: string, details?: any): void {
        try {
            SocketServer.emitToBus(busId, SocketEvent.BUS_STATUS_CHANGE, {
                busId,
                status,
                details,
                timestamp: new Date().toISOString(),
            });
            logger.info('Bus status change broadcasted', { busId, status });
        } catch (error) {
            logger.error('Failed to broadcast bus status', { busId, error });
        }
    },

    /**
     * Broadcast trip status to route subscribers
     */
    broadcastTripStatus(routeId: string, tripId: string, status: string, data?: any): void {
        try {
            const event = status === 'in_progress' ? SocketEvent.TRIP_STARTED
                : status === 'completed' ? SocketEvent.TRIP_COMPLETED
                    : status === 'cancelled' ? SocketEvent.TRIP_CANCELLED
                        : SocketEvent.TRIP_UPDATED;

            SocketServer.emitToRoute(routeId, event, {
                routeId,
                tripId,
                status,
                data,
                timestamp: new Date().toISOString(),
            });
            logger.info('Trip status broadcasted', { routeId, tripId, status });
        } catch (error) {
            logger.error('Failed to broadcast trip status', { tripId, error });
        }
    },

    /**
     * Broadcast incident to route subscribers
     */
    broadcastIncident(routeId: string, incident: any): void {
        try {
            const event = incident.status === 'resolved'
                ? SocketEvent.INCIDENT_RESOLVED
                : SocketEvent.INCIDENT_CREATED;

            SocketServer.emitToRoute(routeId, event, {
                incident,
                timestamp: new Date().toISOString(),
            });
            logger.info('Incident broadcasted', { routeId, incidentId: incident.incidentId });
        } catch (error) {
            logger.error('Failed to broadcast incident', { error });
        }
    },

    /**
     * Broadcast general announcement to all users
     */
    broadcastAnnouncement(message: string, data?: any): void {
        try {
            SocketServer.broadcast(SocketEvent.NOTIFICATION, {
                type: 'announcement',
                message,
                data,
                timestamp: new Date().toISOString(),
            });
            logger.info('Announcement broadcasted', { message });
        } catch (error) {
            logger.error('Failed to broadcast announcement', { error });
        }
    },

    /**
     * Get Socket.io server instance
     */
    getServer() {
        return SocketServer.getIO();
    },

    /**
     * Get number of connected clients
     */
    getConnectedClientsCount(): number {
        return SocketServer.getConnectedClients();
    },

    /**
     * Check if Socket.io is available
     */
    isAvailable(): boolean {
        return SocketServer.getIO() !== null;
    },
};

export default socketUtils;
