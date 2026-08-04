// src/features/route-search/types.ts

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface BusStation {
  id: string;
  name: string;
  distanceMeters: number;
  walkTimeMinutes: number;
  coords: Coordinates;
}

export interface RouteLeg {
  legIndex: number;
  fromStation: string;
  toStation: string;
  busNumber: string;         // e.g. "Bus 1 (Route 08)", "Bus 2 (Route 04)"
  busType: string;           // e.g. "Anbessa Standard", "Sheger Express"
  departureEtaMinutes: number;
  durationMinutes: number;
  fare: string;              // e.g. "8.00 ETB"
  transferWaitMinutes?: number; // Transfer waiting duration in minutes
}

export interface RouteOption {
  id: string;
  isMergedRoute?: boolean;     // true if connection requires multi-bus transit
  transfersCount: number;       // 0 = Direct, 1 = 1 Transfer, 2 = 2 Transits (3 buses)
  busNumber: string;            // e.g. "Route 12 Express" or "Merged: Bus 1 → Bus 2 → Bus 3"
  busType: string;              // e.g. "Anbessa Euro 5" or "Merged 3-Bus Route"
  nearestStation: BusStation;
  busEtaMinutes: number;        // Time until initial bus arrives
  totalTripMinutes: number;     // Total estimated travel time
  fare: string;                 // Total combined fare, e.g. "30.00 ETB"
  crowdLevel: "Low" | "Medium" | "High";
  routeVia: string;             // e.g. "Via Stadium & Mexico Interchanges"
  legs?: RouteLeg[];            // Detailed transit leg breakdown for merged routes
}