import { io, Socket } from 'socket.io-client';

import { config } from '../lib/config';

class SocketService {
    private socket: Socket | null = null;
    private listeners: Record<string, Function[]> = {};

    connect(token: string) {
        if (this.socket?.connected) return;

        // Use the centralized config for WebSocket connection
        const serverUrl = config.wsUrl;

        this.socket = io(serverUrl, {
            auth: { token },
            path: '/socket.io',
        });

        this.socket.on('connect', () => {
            console.log('Connected to socket server');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from socket server');
        });

        // Setup generic listeners that just fan out
        this.socket.onAny((event, ...args) => {
            if (this.listeners[event]) {
                this.listeners[event].forEach(cb => cb(...args));
            }
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    subscribe(room: string) {
        if (this.socket) {
            this.socket.emit(`subscribe:${room}`);
        }
    }

    unsubscribe(room: string) {
        if (this.socket) {
            this.socket.emit(`unsubscribe:${room}`);
        }
    }

    on(event: string, callback: Function) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    off(event: string, callback: Function) {
        if (this.listeners[event]) {
            this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
        }
    }
}

export const socketService = new SocketService();
