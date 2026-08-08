import React, { useState, useEffect } from "react";
import { MapPin, Navigation, Bus, Clock, AlertTriangle, Radio, CheckCircle2 } from "lucide-react";

interface BusStop {
  id: string;
  name: string;
  distanceMeters: number;
  routes: string[];
}

interface IncomingBus {
  busId: string;
  routeNumber: string;
  destination: string;
  etaMinutes: number;
  status: "On Time" | "Delayed" | "Offline";
  delayReason?: string;
}

const MOCK_STOPS: BusStop[] = [
  { id: "s1", name: "Mexico Square Stop", distanceMeters: 150, routes: ["Route 101", "Route 204"] },
  { id: "s2", name: "Meskel Square Station", distanceMeters: 450, routes: ["Route 101", "Route 305"] },
  { id: "s3", name: "Stadium Terminal", distanceMeters: 800, routes: ["Route 204", "Route 305"] },
];

const MOCK_INCOMING: Record<string, IncomingBus[]> = {
  s1: [
    { busId: "SH-204", routeNumber: "Route 101", destination: "Tor Hailoch", etaMinutes: 3, status: "On Time" },
    { busId: "SH-108", routeNumber: "Route 204", destination: "Piyassa", etaMinutes: 9, status: "Delayed", delayReason: "Heavy traffic at Mexico Roundabout" },
    { busId: "SH-099", routeNumber: "Route 101", destination: "Megenagna", etaMinutes: 0, status: "Offline", delayReason: "GPS signal lost" },
  ],
  s2: [
    { busId: "SH-312", routeNumber: "Route 305", destination: "CMC", etaMinutes: 5, status: "On Time" },
  ],
  s3: [],
};

export const StopFinderView: React.FC = () => {
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [selectedStop, setSelectedStop] = useState<BusStop>(MOCK_STOPS[0]);
  const [subscribedBus, setSubscribedBus] = useState<string | null>(null);

  // Step 3: Prompt for location access
  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => setLocationGranted(true),
        () => setLocationGranted(false)
      );
    } else {
      setLocationGranted(false);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  const incomingBuses = MOCK_INCOMING[selectedStop.id] || [];

  return (
    <div className="space-y-6">
      {/* Location Permission Banner */}
      {locationGranted === null && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Navigation className="w-5 h-5 text-indigo-600 animate-bounce" />
            <p className="text-xs sm:text-sm text-indigo-900">
              Allow location access to find bus stops near you automatically.
            </p>
          </div>
          <button
            onClick={requestLocation}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap"
          >
            Enable Location
          </button>
        </div>
      )}

      {/* Main Grid: Stops List vs Interactive Map & Live ETAs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Step 4 & 5: Nearby Bus Stops List */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-600" />
            Nearby Bus Stops
          </h2>

          <div className="space-y-2">
            {MOCK_STOPS.map((stop) => {
              const isSelected = selectedStop.id === stop.id;
              return (
                <div
                  key={stop.id}
                  onClick={() => setSelectedStop(stop)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50/60 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900">{stop.name}</h3>
                    <span className="text-xs text-indigo-600 font-semibold">{stop.distanceMeters}m away</span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-2">
                    {stop.routes.map((r) => (
                      <span key={r} className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 6 & 7: Selected Stop, Incoming Buses, ETAs & Live Subscription */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <span className="text-xs text-indigo-400 font-semibold uppercase tracking-wider">Selected Stop</span>
                <h2 className="text-lg font-bold">{selectedStop.name}</h2>
              </div>
              <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                {incomingBuses.length} Active Buses
              </span>
            </div>

            {/* Step 6: Display Incoming Buses & ETAs */}
            <div className="space-y-3">
              {incomingBuses.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No incoming buses detected for this stop at the moment.
                </div>
              ) : (
                incomingBuses.map((bus) => (
                  <div
                    key={bus.busId}
                    className="bg-slate-800/90 border border-slate-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded">
                          {bus.routeNumber}
                        </span>
                        <span className="text-sm font-semibold text-white">To {bus.destination}</span>
                        <span className="text-xs text-slate-400">({bus.busId})</span>
                      </div>

                      {/* Status alerts for Delay / Offline */}
                      {bus.status === "Delayed" && (
                        <p className="text-xs text-amber-400 flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Delayed: {bus.delayReason}
                        </p>
                      )}
                      {bus.status === "Offline" && (
                        <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Offline: {bus.delayReason}
                        </p>
                      )}
                    </div>

                    {/* Step 7: ETA & Subscribe to Live Updates */}
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-indigo-400">
                          {bus.status === "Offline" ? "N/A" : `${bus.etaMinutes} min ETA`}
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full border ${
                            bus.status === "On Time"
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
                              : bus.status === "Delayed"
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30"
                              : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                          }`}
                        >
                          {bus.status}
                        </span>
                      </div>

                      {bus.status !== "Offline" && (
                        <button
                          onClick={() => setSubscribedBus(subscribedBus === bus.busId ? null : bus.busId)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                            subscribedBus === bus.busId
                              ? "bg-emerald-600 text-white"
                              : "bg-slate-700 hover:bg-slate-600 text-slate-200"
                          }`}
                        >
                          {subscribedBus === bus.busId ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Tracking
                            </>
                          ) : (
                            <>
                              <Radio className="w-3.5 h-3.5" /> Track Live
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};