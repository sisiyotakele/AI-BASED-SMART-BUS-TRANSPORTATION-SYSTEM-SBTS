// src/lib/proximityAlerts.ts
export interface ProximityAlert {
  id: string;
  type: 'alert' | 'warning' | 'success' | 'info';
  title: string;
  message: string;
  stationName: string;
  busId: string;
  etaMinutes: number;
  time: string;
  timestamp: number;
  read: boolean;
  corridor?: string;
}

const STORAGE_KEY = 'sbts_proximity_notifications';

export function getStoredProximityAlerts(): ProximityAlert[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('Failed to read proximity alerts from localStorage:', err);
    return [];
  }
}

export function clearStoredProximityAlerts(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear stored proximity alerts:', err);
  }
}

export function saveProximityAlert(alert: Omit<ProximityAlert, 'id' | 'time' | 'timestamp' | 'read'>): ProximityAlert {
  const newAlert: ProximityAlert = {
    ...alert,
    id: 'prox-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    time: 'Just now',
    timestamp: Date.now(),
    read: false,
  };

  try {
    const existing = getStoredProximityAlerts();
    const updated = [newAlert, ...existing.filter((item) => item.id !== newAlert.id)].slice(0, 30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('sbts:new_notification', { detail: newAlert }));
  } catch (err) {
    console.warn('Failed to save proximity alert:', err);
  }

  return newAlert;
}

export function markProximityAlertAsRead(id: string): void {
  try {
    const existing = getStoredProximityAlerts();
    const updated = existing.map((item) => (item.id === id ? { ...item, read: true } : item));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to mark proximity alert as read:', err);
  }
}

export function markAllProximityAlertsAsRead(): void {
  try {
    const existing = getStoredProximityAlerts();
    const updated = existing.map((item) => ({ ...item, read: true }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to mark all proximity alerts as read:', err);
  }
}

const sessionTriggeredStops = new Set<string>();

export function evaluateStopProximity(
  busProgress: number,
  stops: Array<{ id: string; name: string; coords: { x: number; y: number } }>,
  busId: string,
  routeName: string
): ProximityAlert | null {
  for (const stop of stops) {
    const distanceToStop = Math.abs(busProgress - stop.coords.x);
    if (distanceToStop <= 3.5 && busProgress <= stop.coords.x + 1) {
      const triggerKey = routeName + ':' + busId + ':' + stop.id;
      if (!sessionTriggeredStops.has(triggerKey)) {
        sessionTriggeredStops.add(triggerKey);

        setTimeout(() => {
          sessionTriggeredStops.delete(triggerKey);
        }, 35000);

        const etaMinutes = Math.max(1, Math.round(distanceToStop * 0.6 + 1));
        const alert = saveProximityAlert({
          type: 'alert',
          title: `${routeName} → ${stop.name}`,
          message: `${routeName} • Next: ${stop.name} • ~${etaMinutes} min left`,
          stationName: stop.name,
          busId,
          etaMinutes,
          corridor: routeName,
        });

        return alert;
      }
    }
  }
  return null;
}