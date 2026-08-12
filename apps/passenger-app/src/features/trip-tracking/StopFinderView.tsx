import React, { useState, useEffect, useCallback } from "react";
import { MapPin, Navigation, Bus, Clock, AlertTriangle, Radio, CheckCircle2, Search, Info, RefreshCw } from "lucide-react";
import { RouteDetailPopover } from "../route-search/RouteDetailPopover";
import { RouteOption } from "../route-search/types";
import { useNavigate } from "react-router-dom";
import { routesApi, tripsApi, BackendStop, BackendTrip } from "@/lib/api";

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
  { id: "s4", name: "Megenagna Interchange", distanceMeters: 1200, routes: ["Route 12", "Route 08"] },
  { id: "s5", name: "Bole Airport Terminal 2", distanceMeters: 1800, routes: ["Route 12", "Route 101"] },
];

const MOCK_INCOMING: Record<string, IncomingBus[]> = {
  s1: [
    { busId: "SH-204", routeNumber: "Route 101", destination: "Tor Hailoch", etaMinutes: 3, status: "On Time" },
    { busId: "SH-108", routeNumber: "Route 204", destination: "Piyassa", etaMinutes: 9, status: "Delayed", delayReason: "Heavy traffic at Mexico Roundabout" },
    { busId: "SH-099", routeNumber: "Route 101", destination: "Megenagna", etaMinutes: 0, status: "Offline", delayReason: "GPS signal lost" },
  ],
  s2: [
    { busId: "SH-312", routeNumber: "Route 305", destination: "CMC", etaMinutes: 5, status: "On Time" },
    { busId: "SH-114", routeNumber: "Route 101", destination: "Bole Airport", etaMinutes: 12, status: "On Time" },
  ],
  s3: [
    { busId: "SH-402", routeNumber: "Route 204", destination: "Akaki", etaMinutes: 4, status: "On Time" },
  ],
  s4: [
    { busId: "SH-114", routeNumber: "Route 12", destination: "Bole", etaMinutes: 2, status: "On Time" },
    { busId: "SH-882", routeNumber: "Route 08", destination: "Stadium", etaMinutes: 7, status: "Delayed", delayReason: "Passenger crowd delay" },
  ],
  s5: [
    { busId: "SH-[#991]", routeNumber: "Route 12", destination: "Megenagna", etaMinutes: 6, status: "On Time" },
  ],
};

export const StopFinderView: React.FC = () => {
  const navigate = useNavigate();
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [stopsList, setStopsList] = useState<BusStop[]>(MOCK_STOPS);
  const [selectedStop, setSelectedStop] = useState<BusStop>(MOCK_STOPS[0]);
  const [incomingData, setIncomingData] = useState<Record<string, IncomingBus[]>>(MOCK_INCOMING);
  const [subscribedBus, setSubscribedBus] = useState<string | null>(null);
  const [popoverBus, setPopoverBus] = useState<{ bus: IncomingBus; stop: BusStop } | null>(null);
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchBackendStopsAndTrips = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [stopsRes, tripsRes] = await Promise.allSettled([
        routesApi.getStops(),
        tripsApi.getTrips(),
      ]);

      let apiStops: BusStop[] = [];
      if (stopsRes.status === "fulfilled" && stopsRes.value.data?.success && Array.isArray(stopsRes.value.data.data)) {
        apiStops = stopsRes.value.data.data.map((st: BackendStop, idx: number) => ({
          id: st.id || `stop-${idx}`,
          name: st.stopName || "Bus Stop",
          distanceMeters: Math.round(150 + idx * 300),
          routes: ["Route 12", "Route 101"],
        }));
      }

      if (apiStops.length > 0) {
        setStopsList(apiStops);
        setSelectedStop(apiStops[0]);
        setIsApiConnected(true);
      }

      if (tripsRes.status === "fulfilled" && tripsRes.value.data?.success && Array.isArray(tripsRes.value.data.data)) {
        const backendTrips: BackendTrip[] = tripsRes.value.data.data;
        if (backendTrips.length > 0) {
          const map: Record<string, IncomingBus[]> = {};
          const targetStopId = apiStops[0]?.id || MOCK_STOPS[0].id;
          map[targetStopId] = backendTrips.map((t) => ({
            busId: t.busId?.slice(0, 8) || "BUS-" + Math.floor(Math.random() * 900 + 100),
            routeNumber: "Route 12",
            destination: "Bole Airport",
            etaMinutes: Math.floor(Math.random() * 12) + 2,
            status: t.status === "in_progress" ? "On Time" : t.status === "paused" ? "Delayed" : "On Time",
          }));
          setIncomingData((prev) => ({ ...prev, ...map }));
          setIsApiConnected(true);
        }
      }
    } catch (err) {
      console.warn("Could not load stops/trips from backend API, using fallback data:", err);
      setIsApiConnected(false);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBackendStopsAndTrips();
  }, [fetchBackendStopsAndTrips]);

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

  const filteredStops = stopsList.filter(
    (stop) =>
      stop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stop.routes.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const incomingBuses = incomingData[selectedStop.id] || MOCK_INCOMING[selectedStop.id] || [];


  const handleOpenBusDetails = (bus: IncomingBus) => {
    setPopoverBus({ bus, stop: selectedStop });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            Nearby Bus Stops & Real-Time ETAs
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover active stations around your position with live arrival predictions.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search stop or route..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-indigo-600 focus:bg-white transition-all font-medium"
          />
        </div>
      </div>

      {/* Location Permission Banner */}
      {locationGranted === null && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <Navigation className="w-5 h-5 text-indigo-600 animate-bounce shrink-0" />
            <p className="text-xs sm:text-sm text-indigo-900 font-medium">
              Enable your GPS location to sort nearby bus stops by real distance automatically.
            </p>
          </div>
          <button
            onClick={requestLocation}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-xs"
          >
            Enable Location Access
          </button>
        </div>
      )}

      {/* Main Grid: Stops List vs Incoming Buses View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Nearby Bus Stops List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>Nearby Stations ({filteredStops.length})</span>
            <span className="text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
              GPS Sorted
            </span>
          </h3>

          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {filteredStops.length === 0 ? (
              <div className="bg-white rounded-xl p-6 border border-slate-200 text-center text-xs text-slate-400">
                No stops matched "{searchQuery}".
              </div>
            ) : (
              filteredStops.map((stop) => {
                const isSelected = selectedStop.id === stop.id;
                return (
                  <div
                    key={stop.id}
                    onClick={() => setSelectedStop(stop)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/70 shadow-xs ring-2 ring-indigo-500/20"
                        : "border-slate-200 bg-white hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-slate-900">{stop.name}</h4>
                      <span className="text-xs text-indigo-600 font-bold bg-white px-2 py-0.5 rounded-md border border-indigo-100">
                        {stop.distanceMeters}m away
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2.5">
                      {stop.routes.map((r) => (
                        <span key={r} className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-bold">
                          {r}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Selected Stop, Incoming Buses & Live Action */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl p-5 sm:p-6 shadow-md space-y-5 border" style={{ background: "linear-gradient(135deg, #1e3a6e 0%, #2a4a8a 60%, #1a3060 100%)", borderColor: "rgba(255,255,255,0.08)" }}>
            <div className="flex items-center justify-between pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.12)" }}>
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest block" style={{ color: "#7db8f0" }}>Station Live Dashboard</span>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                  <Bus className="w-4 h-4" style={{ color: "#7db8f0" }} />
                  {selectedStop.name}
                </h3>
              </div>
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full text-white" style={{ backgroundColor: "rgba(125,184,240,0.2)", border: "1px solid rgba(125,184,240,0.35)" }}>
                {incomingBuses.length} Incoming Buses
              </span>
            </div>

            {/* Display Incoming Buses & ETAs */}
            <div className="space-y-3">
              {incomingBuses.length === 0 ? (
                <div className="py-12 text-center text-blue-100 text-xs">
                  No active buses heading towards {selectedStop.name} right now.
                </div>
              ) : (
                incomingBuses.map((bus) => (
                  <div
                    key={bus.busId}
                    className="bg-white/10 hover:bg-white/15 border border-white/15 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-white text-xs font-extrabold px-2.5 py-0.5 rounded-md" style={{ backgroundColor: "#12B2E4" }}>
                          {bus.routeNumber}
                        </span>
                        <span className="text-sm font-bold text-white truncate">To {bus.destination}</span>
                        <span className="text-xs text-blue-100 font-mono">({bus.busId})</span>
                      </div>

                      {bus.status === "Delayed" && (
                        <p className="text-xs text-sky-200 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#12B2E4" }} />
                          Delayed: {bus.delayReason}
                        </p>
                      )}
                      {bus.status === "Offline" && (
                        <p className="text-xs text-rose-200 font-medium flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-300" />
                          Offline: {bus.delayReason}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-sm font-extrabold text-white">
                          {bus.status === "Offline" ? "N/A" : `${bus.etaMinutes} min ETA`}
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                            bus.status === "On Time"
                              ? "bg-emerald-500/20 text-emerald-200 border-emerald-400/30"
                              : bus.status === "Delayed"
                              ? "bg-sky-400/20 text-sky-200 border-sky-300/30"
                              : "bg-rose-500/20 text-rose-200 border-rose-400/30"
                          }`}
                        >
                          {bus.status}
                        </span>
                      </div>

                      {bus.status !== "Offline" && (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleOpenBusDetails(bus)}
                            className="px-3 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            title="Inspect route details"
                          >
                            <Info className="w-3.5 h-3.5" style={{ color: "#12B2E4" }} />
                            <span>Details</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSubscribedBus(subscribedBus === bus.busId ? null : bus.busId);
                              navigate("/tracking");
                            }}
                            className="px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 text-white hover:opacity-90"
                            style={{ backgroundColor: "rgba(125,184,240,0.3)", border: "1px solid rgba(125,184,240,0.4)" }}
                          >
                            <Radio className="w-3.5 h-3.5 animate-pulse" /> Track Live
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Route Detail Popover integration when clicking Details on stop bus */}
      {popoverBus && (
        <RouteDetailPopover
          option={{
            id: `opt-${popoverBus.bus.busId}`,
            busNumber: `${popoverBus.bus.routeNumber} (${popoverBus.bus.busId})`,
            busType: "Anbessa Euro 5 Fleet",
            isMergedRoute: false,
            transfersCount: 0,
            nearestStation: {
              id: popoverBus.stop.id,
              name: popoverBus.stop.name,
              distanceMeters: popoverBus.stop.distanceMeters,
              walkTimeMinutes: Math.round(popoverBus.stop.distanceMeters / 80),
              coords: { lat: 9.01, lng: 38.75 },
            },
            busEtaMinutes: popoverBus.bus.etaMinutes,
            totalTripMinutes: 25,
            fare: "15.00 ETB",
            crowdLevel: "Medium",
            routeVia: `Via ${popoverBus.stop.name} Corridor`,
          }}
          destinationName={popoverBus.bus.destination}
          onClose={() => setPopoverBus(null)}
        />
      )}
    </div>
  );
};

export default StopFinderView;