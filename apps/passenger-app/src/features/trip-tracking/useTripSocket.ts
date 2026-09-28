import { useState, useEffect } from "react";
import { trackingApi } from "@/lib/api";
import { subscribeToAllTracking, BusLocationUpdate } from "@/lib/socket";

export interface BusTelemetry {
  busId: string;
  plateNumber: string;
  currentStop: string;
  etaMinutes: number;
  speedKmH: number;
  occupancyPercent: number;
}

export const useTripSocket = (targetBusId?: string) => {
  const [telemetry, setTelemetry] = useState<BusTelemetry>({
    busId: targetBusId || "SH-204",
    plateNumber: "3-ET-10293",
    currentStop: "Mexico Square",
    etaMinutes: 4,
    speedKmH: 34,
    occupancyPercent: 62,
  });

  useEffect(() => {
    // Initial fetch from backend tracking endpoint
    const fetchInitial = async () => {
      try {
        const res = await trackingApi.getAllBusLocations();
        if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          const buses = res.data.data;
          const match = targetBusId ? buses.find((b: any) => b.busId === targetBusId) : buses[0];
          if (match) {
            setTelemetry((prev) => ({
              ...prev,
              busId: match.busId || prev.busId,
              plateNumber: match.plateNumber || prev.plateNumber,
              speedKmH: Math.round(Number(match.speed || match.speedKmH || 30)),
            }));
          }
        }
      } catch (err) {
        console.warn("Could not load initial tracking telemetry:", err);
      }
    };

    fetchInitial();

    // Subscribe to live websocket updates
    const unsubscribe = subscribeToAllTracking((update: BusLocationUpdate) => {
      if (!targetBusId || update.busId === targetBusId) {
        setTelemetry((prev) => ({
          ...prev,
          busId: update.busId || prev.busId,
          speedKmH: Math.round(update.location?.speed || prev.speedKmH),
          etaMinutes: Math.max(1, prev.etaMinutes),
        }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [targetBusId]);

  return { telemetry };
};