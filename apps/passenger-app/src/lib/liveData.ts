export interface NormalizedStop {
  id: string;
  name: string;
  distanceMeters: number;
  routes: string[];
  coords: { lat: number; lng: number };
  address?: string;
}

export interface NormalizedNotification {
  id: string;
  type: 'alert' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export interface NormalizedTripHistoryItem {
  id: string;
  date: string;
  route: string;
  bus: string;
  fare: string;
  status: string;
}

const toNumber = (value: unknown, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

export const normalizeStopFromBackend = (stop: Record<string, unknown> | any): NormalizedStop => {
  const name = String(stop.stopName ?? stop.name ?? 'Bus Stop');
  const lat = toNumber(stop.latitude ?? stop.lat, 0);
  const lng = toNumber(stop.longitude ?? stop.lng, 0);
  const distanceKm = toNumber(stop.distanceKm ?? stop.distance_km, 0);
  const distanceMeters = Math.round(distanceKm * 1000);

  return {
    id: String(stop.id ?? `${name}-${Math.random()}`),
    name,
    distanceMeters: distanceMeters > 0 ? distanceMeters : 0,
    routes: Array.isArray(stop.routes) ? stop.routes.map((v: unknown) => String(v)) : [],
    coords: { lat, lng },
    address: stop.address ? String(stop.address) : undefined,
  };
};

export const normalizeNotificationFromBackend = (entry: Record<string, unknown> | any): NormalizedNotification => {
  const notification = (entry.notification && typeof entry.notification === 'object' ? entry.notification as Record<string, unknown> : entry) as Record<string, unknown>;
  const typeRaw = String(notification.notificationType ?? notification.type ?? 'info').toLowerCase();
  const type: NormalizedNotification['type'] =
    typeRaw.includes('emergency') || typeRaw.includes('alert')
      ? 'alert'
      : typeRaw.includes('maintenance') || typeRaw.includes('warning')
        ? 'warning'
        : typeRaw.includes('trip') || typeRaw.includes('success')
          ? 'success'
          : 'info';

  return {
    id: String(entry.id ?? notification.id ?? Math.random()),
    type,
    title: String(notification.title ?? 'Notification'),
    message: String(notification.message ?? notification.description ?? ''),
    time: notification.createdAt
      ? new Date(String(notification.createdAt)).toLocaleString([], {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Just now',
    read: Boolean(entry.isRead ?? entry.read ?? notification.isRead ?? false),
  };
};

export const normalizeTripHistoryItem = (trip: Record<string, unknown> | any): NormalizedTripHistoryItem => {
  const startDate = trip.scheduledStart ? new Date(String(trip.scheduledStart)) : new Date();
  const routeRaw = String(
    (trip.routeName as string | undefined) ??
      (trip.route as { routeName?: string } | undefined)?.routeName ??
      'Megenagna → Bole Airport'
  );

  return {
    id: `TRP-${String(trip.id ?? Math.random()).slice(0, 12)}`,
    date: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    route: routeRaw,
    bus: String((trip.bus as { plateNumber?: string } | undefined)?.plateNumber ?? trip.busId ?? 'SBTS-BUS'),
    fare: '15.00 ETB',
    status: String(trip.status ?? 'Completed').charAt(0).toUpperCase() + String(trip.status ?? 'Completed').slice(1),
  };
};
