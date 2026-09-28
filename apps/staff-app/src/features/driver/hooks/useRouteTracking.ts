// src/features/driver/hooks/useRouteTracking.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import { STOPS, STOP_NAMES, TOTAL_DISTANCE_KM } from '../constants/map';
import { haversineKm, lerp, formatTime } from '../utils/gps';

type LatLng = [number, number];
type TrafficStatus = "Normal" | "Moderate" | "Heavy";

interface TripData {
  position: LatLng;
  currentStop: number;
  remainingKm: number;
  eta: number;
  etaFormatted: string;
  progressPercentage: number;
  completed: boolean;
  nextStop: string;
}

interface UseRouteTrackingReturn {
  trip: TripData;
  speed: number;
  setSpeed: (speed: number) => void;
  trafficStatus: TrafficStatus;
  trafficDelay: number;
  trafficSuggestion: string;
  traveledKm: number;
  isFollowing: boolean;
  setIsFollowing: (following: boolean) => void;
  toggleFollowing: () => void;
}

const TICK_MS = 1000;

export const useRouteTracking = (): UseRouteTrackingReturn => {
  const [traveledKm, setTraveledKm] = useState(0);
  const [speed, setSpeed] = useState(35);
  const [isFollowing, setIsFollowing] = useState(true);
  const [trafficStatus, setTrafficStatus] = useState<TrafficStatus>("Normal");
  const [trafficDelay, setTrafficDelay] = useState(0);
  const [trafficSuggestion, setTrafficSuggestion] = useState("Continue current route ✓");

  // ─── Calculate segment distances ──────────────────────────────
  const { segmentDistances, cumulativeDistances, totalDistance } = useMemo(() => {
    const segs: number[] = [];
    for (let i = 0; i < STOPS.length - 1; i++) {
      segs.push(haversineKm(STOPS[i], STOPS[i + 1]));
    }
    const cum: number[] = [0];
    segs.forEach((d) => cum.push(cum[cum.length - 1] + d));
    return {
      segmentDistances: segs,
      cumulativeDistances: cum,
      totalDistance: cum[cum.length - 1],
    };
  }, []);

  // ─── Calculate trip data ──────────────────────────────────────
  const trip = useMemo((): TripData => {
    const clamped = Math.min(traveledKm, totalDistance);
    let segmentIndex = cumulativeDistances.findIndex(
      (d, i) => clamped >= d && clamped < (cumulativeDistances[i + 1] ?? Infinity)
    );
    const completed = clamped >= totalDistance;
    if (completed) segmentIndex = STOPS.length - 2;
    if (segmentIndex < 0) segmentIndex = 0;

    const segStart = cumulativeDistances[segmentIndex];
    const segLen = segmentDistances[segmentIndex] || 1;
    const segProgress = completed ? 1 : (clamped - segStart) / segLen;

    const position = lerp(STOPS[segmentIndex], STOPS[segmentIndex + 1], segProgress);
    const remainingKm = Math.max(totalDistance - clamped, 0);
    const eta = remainingKm > 0 ? Math.ceil((remainingKm / speed) * 60) : 0;
    const progressPercentage = (clamped / totalDistance) * 100;
    const nextStop = completed ? "Trip Completed" : STOP_NAMES[segmentIndex + 1] || "Final Stop";

    return {
      position,
      currentStop: segmentIndex,
      remainingKm,
      eta,
      etaFormatted: formatTime(eta),
      progressPercentage,
      completed,
      nextStop,
    };
  }, [traveledKm, speed, totalDistance, cumulativeDistances, segmentDistances]);

  // ─── Toggle following ─────────────────────────────────────────
  const toggleFollowing = useCallback(() => {
    setIsFollowing((prev) => !prev);
  }, []);

  // ─── Simulate movement ──────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomize speed
      setSpeed((prev) => {
        const newSpeed = Math.floor(Math.random() * (45 - 25) + 25);
        return newSpeed;
      });

      // Move the bus
      setTraveledKm((prev) => {
        if (prev >= totalDistance) {
          clearInterval(interval);
          return prev;
        }
        const kmThisTick = (speed / 3600) * (TICK_MS / 1000);
        return Math.min(prev + kmThisTick, totalDistance);
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [totalDistance, speed]);

  // ─── Simulate traffic updates ──────────────────────────────
  useEffect(() => {
    const trafficInterval = setInterval(() => {
      const levels: Array<{ status: TrafficStatus; delay: number; suggestion: string }> = [
        { status: "Normal", delay: 0, suggestion: "Continue current route ✓" },
        { status: "Moderate", delay: 5, suggestion: "Reduce speed near intersection" },
        { status: "Heavy", delay: 10, suggestion: "Consider alternative route" },
      ];
      const pick = levels[Math.floor(Math.random() * levels.length)];
      setTrafficStatus(pick.status);
      setTrafficDelay(pick.delay);
      setTrafficSuggestion(pick.suggestion);
    }, 5000);

    return () => clearInterval(trafficInterval);
  }, []);

  return {
    trip,
    speed,
    setSpeed,
    trafficStatus,
    trafficDelay,
    trafficSuggestion,
    traveledKm,
    isFollowing,
    setIsFollowing,
    toggleFollowing,
  };
};