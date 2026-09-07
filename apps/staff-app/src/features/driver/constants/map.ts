// src/features/driver/constants/map.ts

export type LatLng = [number, number];
export type MapType = "street" | "satellite" | "terrain" | "dark";

export const MAP_TILES: Record<MapType, { url: string; attribution: string; label: string }> = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    label: "Street",
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com">Esri</a>',
    label: "Satellite",
  },
  terrain: {
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a>',
    label: "Terrain",
  },
  dark: {
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; CartoDB',
    label: "Dark",
  },
};

export const TRAFFIC_STYLES = {
  Normal: { text: "text-emerald-600", chip: "bg-emerald-50 text-emerald-600", dot: "bg-emerald-500" },
  Moderate: { text: "text-amber-600", chip: "bg-amber-50 text-amber-600", dot: "bg-amber-500" },
  Heavy: { text: "text-red-600", chip: "bg-red-50 text-red-600", dot: "bg-red-500" },
} as const;

export const STOP_NAMES = ["Mexico Sq.", "Stadium", "Bole Road", "Bole Airport"];
export const STOPS: LatLng[] = [
  [9.032, 38.7469],
  [9.02, 38.75],
  [9.01, 38.76],
  [8.99, 38.78],
];
export const BUS_ID = "SBTS-102";
export const TOTAL_DISTANCE_KM = 12.5;

export const getRouteFromOSRM = async (stops: LatLng[]): Promise<LatLng[]> => {
  try {
    const coordinates = stops.map(([lat, lng]) => `${lng},${lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const coords = data.routes[0].geometry.coordinates;
      return coords.map((coord: [number, number]) => [coord[1], coord[0]] as LatLng);
    }
    return stops;
  } catch (error) {
    console.error('Failed to fetch route:', error);
    return stops;
  }
};