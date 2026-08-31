// src/features/driver/types/trip.types.ts

export type TripStatus = "idle" | "running" | "paused";
export type TripStatusType = "Completed" | "Delayed" | "Cancelled" | "In-progress";
export type TrafficType = "Light" | "Moderate" | "Heavy";

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface Trip {
  id: string;
  tripId: string;
  date: string;
  route: string;
  routeCode: string;
  time: string;
  bus: string;
  status: TripStatusType;
  stops: number;
  distance: string;
  duration: string;
  passengers: number;
  rating: number;
  onTime: string;
  fuelUsed: string;
  traffic: TrafficType;
  scheduledDeparture: string;
  actualDeparture: string;
  scheduledArrival: string;
  actualArrival: string;
  notes: string;
  city: string;
  routeType: string;
  startStop: string;
  endStop: string;
}

export interface CompletedTrip {
  id: number;
  route: string;
  date: string;
  startTime: string;
  endTime: string;
  distance: string;
  status: "Completed";
}

export interface UpcomingTrip {
  id: number;
  route: string;
  date: string;
  time: string;
  stops: number;
  distance: string;
  status: "Scheduled" | "Confirmed" | "In-progress";
}

export interface StatusMeta {
  label: string;
  dot: string;
  pillBg: string;
  pillText: string;
  progress: number;
}