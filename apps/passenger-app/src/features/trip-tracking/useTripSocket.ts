import { useState, useEffect } from "react";

export interface BusTelemetry {
  busId: string;
  plateNumber: string;
  currentStop: string;
  etaMinutes: number;
  speedKmH: number;
  occupancyPercent: number;
}

export const useTripSocket = () => {
  const [telemetry, setTelemetry] = useState<BusTelemetry>({
    busId: "SH-204",
    plateNumber: "3-ET-10293",
    currentStop: "Mexico Square",
    etaMinutes: 4,
    speedKmH: 34,
    occupancyPercent: 62,
  });

  // Simulated live GPS telemetry tick
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((prev) => ({
        ...prev,
        speedKmH: Math.floor(Math.random() * 15) + 25,
        etaMinutes: Math.max(1, prev.etaMinutes - (Math.random() > 0.7 ? 1 : 0)),
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return { telemetry };
};