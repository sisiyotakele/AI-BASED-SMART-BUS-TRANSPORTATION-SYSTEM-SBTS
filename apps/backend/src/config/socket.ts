import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, ServerOptions } from 'socket.io';
import { env } from './env';
import { logger } from '@/common/logger';

/**
 * Socket.io Configuration
 * Real-time communication for bus tracking, notifications, etc.
 */

export const socketConfig: Partial<ServerOptions> = {
    path: env.SOCKET_PATH,

    cors: {
        origin: env.SOCKET_CORS_ORIGIN.split(',').map(o => o.trim()),
        credentials: env.CORS_CREDENTIALS,
        methods: ['GET', 'POST'],
    },

    pingTimeout: env.SOCKET_PING_TIMEOUT,
    pingInterval: env.SOCKET_PING_INTERVAL,

    maxHttpBufferSize: 1e6, // 1 MB

    transports: ['websocket', 'polling'],

    // Connection state recovery
    connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutes
        skipMiddlewares: true,
    },
};

/**
 * Socket.io Server Singleton
 */
class SocketServer {
    private static instance: SocketIOServer | null = null;
    private static connectedClients = 0;

    static initialize(httpServer: HttpServer): SocketIOServer | null {
        if (!env.SOCKET_ENABLED) {
            logger.info('Socket.io is disabled');
            return null;
        }

        if (SocketServer.instance) {
            logger.warn('Socket.io already initialized');
            return SocketServer.instance;
        }

        try {
            SocketServer.instance = new SocketIOServer(httpServer, socketConfig);

            SocketServer.setupEventHandlers();

            logger.info('✅ Socket.io initialized', {
                path: env.SOCKET_PATH,
                transports: socketConfig.transports,
            });

            return SocketServer.instance;
        } catch (error) {
            logger.error('❌ Failed to initialize Socket.io', { error });
            return null;
        }
    }

    private static setupEventHandlers(): void {
        if (!SocketServer.instance) return;

        const io = SocketServer.instance;

        // Authentication middleware
        io.use((socket, next) => {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization;

            if (!token) {
                logger.warn('Socket connection accepted without token (development mode)', {
                    socketId: socket.id,
                    ip: socket.handshake.address,
                });
                // In development, allow connection without token
                socket.data.userId = 'dev-user-' + Math.random();
                return next();
            }

            // TODO: Verify JWT token and attach user to socket.data
            // For now, accepting all connections
            socket.data.userId = 'user-' + Math.random(); // Replace with actual user ID from token
            next();
        });

        // Connection handler
        io.on('connection', (socket) => {
            SocketServer.connectedClients++;

            logger.info('Socket client connected', {
                socketId: socket.id,
                userId: socket.data.userId,
                transport: socket.conn.transport.name,
                totalClients: SocketServer.connectedClients,
            });

            // Check max connections
            if (SocketServer.connectedClients > env.SOCKET_MAX_CONNECTIONS) {
                logger.warn('Max socket connections reached, disconnecting oldest', {
                    maxConnections: env.SOCKET_MAX_CONNECTIONS,
                });
                socket.disconnect(true);
                return;
            }

            // Join user-specific room
            socket.join(`user:${socket.data.userId}`);

            // Handle custom events
            socket.on('subscribe:bus', (busId: string) => {
                socket.join(`bus:${busId}`);
                logger.debug('Client subscribed to bus updates', { socketId: socket.id, busId });
            });

            socket.on('unsubscribe:bus', (busId: string) => {
                socket.leave(`bus:${busId}`);
                logger.debug('Client unsubscribed from bus updates', { socketId: socket.id, busId });
            });

            socket.on('subscribe:trip', (tripId: string) => {
                socket.join(`trip:${tripId}`);
                logger.debug('Client subscribed to trip tracking', { socketId: socket.id, tripId });
            });

            socket.on('unsubscribe:trip', (tripId: string) => {
                socket.leave(`trip:${tripId}`);
                logger.debug('Client unsubscribed from trip tracking', { socketId: socket.id, tripId });
            });

            socket.on('subscribe:tracking', () => {
                socket.join('tracking:all');
                logger.debug('Client subscribed to all GPS tracking', { socketId: socket.id });
            });

            socket.on('unsubscribe:tracking', () => {
                socket.leave('tracking:all');
                logger.debug('Client unsubscribed from all GPS tracking', { socketId: socket.id });
            });

            socket.on('subscribe:route', (routeId: string) => {
                socket.join(`route:${routeId}`);
                logger.debug('Client subscribed to route updates', { socketId: socket.id, routeId });
            });

            socket.on('unsubscribe:route', (routeId: string) => {
                socket.leave(`route:${routeId}`);
                logger.debug('Client unsubscribed from route updates', { socketId: socket.id, routeId });
            });

            // Disconnection handler
            socket.on('disconnect', (reason) => {
                SocketServer.connectedClients--;
                logger.info('Socket client disconnected', {
                    socketId: socket.id,
                    userId: socket.data.userId,
                    reason,
                    totalClients: SocketServer.connectedClients,
                });
            });

            // Error handler
            socket.on('error', (error) => {
                logger.error('Socket error', {
                    socketId: socket.id,
                    userId: socket.data.userId,
                    error,
                });
            });
        });

        // Server error handler
        io.engine.on('connection_error', (error) => {
            logger.error('Socket.io connection error', { error });
        });
    }

    static getIO(): SocketIOServer | null {
        return SocketServer.instance;
    }

    static getConnectedClients(): number {
        return SocketServer.connectedClients;
    }

    /**
     * Emit to specific user
     */
    static emitToUser(userId: string, event: string, data: any): void {
        if (!SocketServer.instance) return;
        SocketServer.instance.to(`user:${userId}`).emit(event, data);
    }

    /**
     * Emit to all users subscribed to a bus
     */
    static emitToBus(busId: string, event: string, data: any): void {
        if (!SocketServer.instance) return;
        SocketServer.instance.to(`bus:${busId}`).emit(event, data);
    }

    /**
     * Emit to all users subscribed to a route
     */
    static emitToRoute(routeId: string, event: string, data: any): void {
        if (!SocketServer.instance) return;
        SocketServer.instance.to(`route:${routeId}`).emit(event, data);
    }

    /**
     * Broadcast to all connected clients
     */
    static broadcast(event: string, data: any): void {
        if (!SocketServer.instance) return;
        SocketServer.instance.emit(event, data);
    }

    /**
     * Close all connections
     */
    static async close(): Promise<void> {
        if (SocketServer.instance) {
            await new Promise<void>((resolve) => {
                SocketServer.instance!.close(() => {
                    logger.info('✅ Socket.io server closed');
                    resolve();
                });
            });
            SocketServer.instance = null;
            SocketServer.connectedClients = 0;
        }
    }

    /**
     * Health check
     */
    static healthCheck(): { healthy: boolean; clients: number } {
        return {
            healthy: SocketServer.instance !== null,
            clients: SocketServer.connectedClients,
        };
    }
}

export { SocketServer };

/**
 * Initialize Socket.IO server
 * Call this once during bootstrap with the HTTP server instance
 */
export function initializeSocketIO(httpServer: HttpServer): SocketIOServer | null {
    return SocketServer.initialize(httpServer);
}

/**
 * Get the Socket.IO server instance
 */
export function getSocketIO(): SocketIOServer | null {
    return SocketServer.getIO();
}

/**
 * Helper utilities for emitting events
 */
export const socketUtils = {
    emitToUser: SocketServer.emitToUser.bind(SocketServer),
    emitToBus: SocketServer.emitToBus.bind(SocketServer),
    emitToRoute: SocketServer.emitToRoute.bind(SocketServer),
    broadcast: SocketServer.broadcast.bind(SocketServer),
    healthCheck: SocketServer.healthCheck.bind(SocketServer),
};
