// src/features/driver/utils/gps.ts

export type LatLng = [number, number];

export const checkSameLocation = (locA: string, locB: string, threshold: number = 50): boolean => {
  if (!locA || !locB || locA === "Unknown" || locA === "Location not available" || locB === "Location not available") {
    return true;
  }
  
  try {
    const [latA, lngA] = locA.split(", ").map(Number);
    const [latB, lngB] = locB.split(", ").map(Number);
    
    if (isNaN(latA) || isNaN(lngA) || isNaN(latB) || isNaN(lngB)) {
      return true;
    }
    
    const R = 6371;
    const dLat = ((latB - latA) * Math.PI) / 180;
    const dLng = ((lngB - lngA) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((latA * Math.PI) / 180) *
        Math.cos((latB * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c * 1000;
    return distance < threshold;
  } catch {
    return true;
  }
};

export const formatCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

export const getLocationFromBrowser = (): Promise<string> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve("Geolocation not supported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve(formatCoordinates(position.coords.latitude, position.coords.longitude));
      },
      () => {
        resolve("Location not available");
      }
    );
  });
};

export const haversineKm = (a: LatLng, b: LatLng): number => {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};

export const lerp = (a: LatLng, b: LatLng, t: number): LatLng => {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
};

export const formatTime = (minutes: number): string => {
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};