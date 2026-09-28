import { io, Socket } from "socket.io-client";
import { useEffect, useState } from "react";

// ─── Socket Server Configuration ─────────────────────────────────────────────
const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_BASE_URL?.replace("/api/v1", "") ||
  "http://localhost:5000";

export interface BusLocationUpdate {
  busId: string;
  location: {
    latitude: number;
    longitude: number;
    speed?: number;
    heading?: number;
  };
  timestamp?: string;
}

export interface TripStatusUpdate {
  routeId?: string;
  tripId: string;
  status: "scheduled" | "in_progress" | "paused" | "completed" | "cancelled";
  timestamp?: string;
}

export interface SystemNotificationEvent {
  type?: string;
  title?: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp?: string;
}

// ─── Socket Instance Singleton ───────────────────────────────────────────────
export let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem("token");
    socket = io(SOCKET_URL, {
      path: "/socket.io",
      auth: { token },
      transports: ["websocket", "polling"],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    socket.on("connect", () => {
      console.log("🟢 Connected to SBTS WebSocket Server:", socket?.id);
    });

    socket.on("disconnect", (reason) => {
      console.warn("🔴 Disconnected from SBTS WebSocket Server:", reason);
    });

    socket.on("connect_error", (error) => {
      console.warn("⚠️ WebSocket connection error:", error.message);
    });
  }

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

// ─── Event Subscription Helpers ──────────────────────────────────────────────

/**
 * Subscribe to all live GPS tracking updates across the bus fleet.
 */
export function subscribeToAllTracking(onUpdate: (data: BusLocationUpdate) => void): () => void {
  const sk = getSocket();
  sk.emit("subscribe:tracking");

  const listener = (data: BusLocationUpdate) => onUpdate(data);
  sk.on("bus:location:update", listener);

  return () => {
    sk.emit("unsubscribe:tracking");
    sk.off("bus:location:update", listener);
  };
}

/**
 * Subscribe to live GPS updates for a specific bus.
 */
export function subscribeToBus(busId: string, onUpdate: (data: BusLocationUpdate) => void): () => void {
  const sk = getSocket();
  sk.emit("subscribe:bus", busId);

  const listener = (data: BusLocationUpdate) => {
    if (!data.busId || data.busId === busId) {
      onUpdate(data);
    }
  };
  sk.on("bus:location:update", listener);

  return () => {
    sk.emit("unsubscribe:bus", busId);
    sk.off("bus:location:update", listener);
  };
}

/**
 * Subscribe to status updates for a specific trip.
 */
export function subscribeToTrip(tripId: string, onUpdate: (data: TripStatusUpdate) => void): () => void {
  const sk = getSocket();
  sk.emit("subscribe:trip", tripId);

  const listener = (data: TripStatusUpdate) => onUpdate(data);
  sk.on("trip:started", listener);
  sk.on("trip:updated", listener);
  sk.on("trip:completed", listener);
  sk.on("trip:cancelled", listener);

  return () => {
    sk.emit("unsubscribe:trip", tripId);
    sk.off("trip:started", listener);
    sk.off("trip:updated", listener);
    sk.off("trip:completed", listener);
    sk.off("trip:cancelled", listener);
  };
}

/**
 * Subscribe to real-time notifications and announcements.
 */
export function subscribeToNotifications(onNotification: (data: SystemNotificationEvent) => void): () => void {
  const sk = getSocket();

  const listener = (data: SystemNotificationEvent) => onNotification(data);
  sk.on("notification", listener);

  return () => {
    sk.off("notification", listener);
  };
}

// ─── React Hooks ─────────────────────────────────────────────────────────────

/**
 * React hook for monitoring Socket.io connection state and receiving live bus GPS updates.
 */
export function useLiveBusSocket(busId?: string) {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [latestLocation, setLatestLocation] = useState<BusLocationUpdate | null>(null);

  useEffect(() => {
    const sk = getSocket();
    setIsConnected(sk.connected);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    sk.on("connect", onConnect);
    sk.on("disconnect", onDisconnect);

    let unsubscribe: () => void;
    if (busId) {
      unsubscribe = subscribeToBus(busId, (update) => setLatestLocation(update));
    } else {
      unsubscribe = subscribeToAllTracking((update) => setLatestLocation(update));
    }

    return () => {
      sk.off("connect", onConnect);
      sk.off("disconnect", onDisconnect);
      unsubscribe();
    };
  }, [busId]);

  return { isConnected, latestLocation };
}
