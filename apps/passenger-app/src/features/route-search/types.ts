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
  busNumber: string;
  busType: string;
  departureEtaMinutes: number;
  durationMinutes: number;
  fare: string | null;
  transferWaitMinutes?: number;
}

export interface AiTrafficPrediction {
  status: "On Time" | "Likely Delayed" | "Delayed";
  delayMinutes?: number;  // estimated delay in minutes (0 for On Time)
  congestionLevel: "Low" | "Moderate" | "Heavy";
  reason?: string;        // short reason, e.g. "Heavy traffic at Meskel Square"
  confidence: number;     // AI confidence 0–100
}

export interface RouteOption {
  id: string;
  isMergedRoute?: boolean;
  transfersCount: number;
  busNumber: string;
  busType: string;
  nearestStation: BusStation;
  busEtaMinutes: number;
  totalTripMinutes: number;
  fare: string | null;
  crowdLevel: "Low" | "Medium" | "High";
  routeVia: string;
  viaDescription?: string;
  legs?: RouteLeg[];
  aiTrafficPrediction?: AiTrafficPrediction;
  nextDeparture?: string;
  stops?: string[];
}
