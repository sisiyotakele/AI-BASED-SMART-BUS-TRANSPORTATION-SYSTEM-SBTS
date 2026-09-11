// src/features/dashboard/CollapsibleSidePanel.tsx
// Google Maps–style Split-Screen Control Sidebar on Desktop (390px–420px)
// & Draggable Pull-up Bottom Sheet on Mobile (40% default height, 90% expanded with "Where to?" search + pills)

import React, { useState, useEffect } from "react";
import {
  Navigation,
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Search,
  ArrowRight,
  ArrowLeft,
  Clock,
  Bus,
  RefreshCw,
  Radio,
  Sparkles,
  Zap,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Loader2,
  X,
  Compass,
  Locate,
  Info,
  GitMerge,
  Footprints,
} from "lucide-react";
import { routesApi, aiIntegrationApi } from "@/lib/api";
import { PlaceAutocomplete, AutocompleteItem } from "@/components/PlaceAutocomplete";
import { TripPlanDetailPopover } from "@/components/TripPlanDetailPopover";

// ─── Types ────────────────────────────────────────────────────────────────────
type MobileTab = "trip" | "stops" | "ai";

interface TripPlan {
  id: string;
  routeName: string;
  originStop: string;
  destinationStop: string;
  transfers: number;
  totalTimeMin: number;
  nextDepartureMin: number;
  fare?: string;
  viaStops?: string[];
  frequencyMin?: number;
  walkingMinutes?: number;
  isMergedRoute?: boolean;
  legs?: any[];
  crowdLevel?: string;
  nearestStation?: any;
}

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
}

interface ActiveRouteTelemetry {
  hasActiveRoute: boolean;
  displayRouteId: string;
  displayBusId: string;
  originLabel: string;
  destLabel: string;
  busProgress: number;
  currentSpeed: number;
  isTripCompleted: boolean;
  displayStops: any[];
  routeAiPrediction: any;
  routeAiLoading: boolean;
  isWebSocketActive: boolean;
}

const NEARBY_STOPS: BusStop[] = [
  { id: "stop-meg", name: "Megenagna Hub", distanceMeters: 180, routes: ["Route 12", "Route 08", "Route 18"] },
  { id: "stop-cmc", name: "CMC Michael Station", distanceMeters: 340, routes: ["Route 12", "Route 18"] },
  { id: "stop-ayat", name: "Ayat Terminal", distanceMeters: 490, routes: ["Route 12", "Route 16"] },
  { id: "stop-bole", name: "Bole Medhanealem", distanceMeters: 620, routes: ["Route 04", "Route 12", "Route 08"] },
  { id: "stop-airport", name: "Bole Airport Terminal", distanceMeters: 850, routes: ["Route 12", "Route 04"] },
  { id: "stop-mex", name: "Mexico Square Hub", distanceMeters: 920, routes: ["Route 18", "Route 08", "Route 04"] },
  { id: "stop-std", name: "Stadium Central Hub", distanceMeters: 1100, routes: ["Route 04", "Route 08"] },
  { id: "stop-tor", name: "Tor Hailoch Station", distanceMeters: 1250, routes: ["Route 04", "Route 12"] },
];

const INCOMING_BUSES: Record<string, IncomingBus[]> = {
  "stop-meg": [
    { busId: "SBTS-BUS-114", routeNumber: "Route 12 Express", destination: "Bole Airport", etaMinutes: 3, status: "On Time" },
    { busId: "ET-3-84729", routeNumber: "Route 08 Direct", destination: "Mexico Square", etaMinutes: 7, status: "On Time" },
    { busId: "SBTS-BUS-073", routeNumber: "Route 18 Express", destination: "CMC Michael", etaMinutes: 12, status: "Delayed" },
  ],
  "stop-cmc": [
    { busId: "SBTS-BUS-092", routeNumber: "Route 12 Express", destination: "Bole Airport", etaMinutes: 5, status: "On Time" },
    { busId: "ET-3-11201", routeNumber: "Route 18 Local", destination: "Mexico Square", etaMinutes: 9, status: "On Time" },
  ],
  "stop-bole": [
    { busId: "SBTS-BUS-044", routeNumber: "Route 04 Direct", destination: "Stadium", etaMinutes: 4, status: "On Time" },
    { busId: "SBTS-BUS-114", routeNumber: "Route 12 Express", destination: "Megenagna", etaMinutes: 8, status: "On Time" },
  ],
  "stop-airport": [
    { busId: "SBTS-BUS-114", routeNumber: "Route 12 Express", destination: "Megenagna", etaMinutes: 6, status: "On Time" },
  ],
};

// ─── Trip Planner Panel ───────────────────────────────────────────────────────
const TripPlannerPanel: React.FC<{ onRouteSelected?: () => void; initialQuery?: string }> = ({ onRouteSelected, initialQuery = "" }) => {
  const [origin, setOrigin] = useState(initialQuery || "");
  const [routingOrigin, setRoutingOrigin] = useState<string | null>(null);
  const [destination, setDestination] = useState("");
  const [results, setResults] = useState<TripPlan[] | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [detailedPlan, setDetailedPlan] = useState<TripPlan | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  useEffect(() => {
    const handleRouteSelected = (e: any) => {
      if (!e.detail?.selectedRoute) {
        setSelectedRouteId(null);
        return;
      }
      if (e.detail?.destination) {
        setDestination(e.detail.destination);
      }
      if (e.detail?.origin) {
        setOrigin(e.detail.origin);
      }
    };
    window.addEventListener("sbts:select_route", handleRouteSelected);
    return () => window.removeEventListener("sbts:select_route", handleRouteSelected);
  }, []);

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Location is not supported by this browser.");
      return;
    }
    setIsLocating(true);
    setLocationStatus("Requesting your location permission...");
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const addressResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`
          );
          const addressData = addressResponse.ok
            ? await addressResponse.json() as { display_name?: string }
            : {};
          const response = await routesApi.getNearbyStops(coords.latitude, coords.longitude, 5);
          const nearestStop = response.data?.data?.[0];
          if (!nearestStop?.stopName) throw new Error("No nearby stop found");
          const address = addressData.display_name || nearestStop.address || "Address unavailable";
          const distance = Number(nearestStop.distanceKm || 0).toFixed(2);
          setOrigin(address);
          setRoutingOrigin(nearestStop.stopName);
          setLocationStatus(`Nearest bus stop: ${nearestStop.stopName} (${distance} km away)`);
        } catch {
          setLocationStatus("No nearby bus stop found. Enter your starting point.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        setLocationStatus(
          error.code === error.PERMISSION_DENIED
            ? "Location access was denied. Allow location access in your browser settings and try again."
            : "Could not get your location. Check GPS and try again."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSelectRoute = (plan: TripPlan) => {
    setSelectedRouteId(plan.id);
    window.dispatchEvent(
      new CustomEvent("sbts:select_route", {
        detail: {
          selectedRoute: {
            id: plan.id,
            busNumber: plan.routeName,
            routeVia: `${plan.originStop} → ${plan.destinationStop}`,
            totalTripMinutes: plan.totalTimeMin,
            fare: plan.fare || "15.00 ETB",
            nearestStation: { name: plan.originStop, walkTimeMinutes: plan.walkingMinutes || 3 },
            isMergedRoute: plan.isMergedRoute,
            legs: plan.legs,
          },
          origin: plan.originStop,
          destination: plan.destinationStop,
          viaStops: plan.viaStops || [],
        },
      })
    );
    if (onRouteSelected) onRouteSelected();
  };

  const handlePlanTrip = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!origin || !destination) return;
    setIsPlanning(true);
    try {
      const res = await routesApi.planRoute(routingOrigin || origin, destination);
      let plans: TripPlan[] = Array.isArray(res.data?.data)
        ? res.data.data.map((route: any) => {
            const via = String(route.routeVia || "").split(" → ").map((s: string) => s.trim()).filter(Boolean);
            const legs = Array.isArray(route.legs) ? route.legs : undefined;
            const transfers = Number(route.transfersCount || (legs && legs.length > 1 ? legs.length - 1 : 0));
            const isMerged = Boolean(route.isMergedRoute || transfers > 0);
            return {
              id: String(route.id),
              routeName: String(route.routeName || route.busNumber || route.routeCode || route.name || "Scheduled Service"),
              originStop: String((route.nearestStation as { name?: string })?.name || origin),
              destinationStop: destination,
              transfers,
              isMergedRoute: isMerged,
              totalTimeMin: Number(route.totalTripMinutes || 25),
              nextDepartureMin: Number(route.busEtaMinutes || 4),
              fare: String(route.fare || "15.00 ETB"),
              walkingMinutes: Number((route.nearestStation as { walkTimeMinutes?: number })?.walkTimeMinutes || 3),
              viaStops: via.length > 0 ? via : [origin, destination],
              legs,
              crowdLevel: String(route.crowdLevel || "Medium"),
              nearestStation: route.nearestStation,
            };
          })
        : [];
      const uniquePlans = plans.filter((plan, index, self) =>
        index === self.findIndex((p) => p.routeName === plan.routeName)
      );
      uniquePlans.sort((a, b) => (a.totalTimeMin + a.transfers * 5) - (b.totalTimeMin + b.transfers * 5));
      setResults(uniquePlans);
    } catch {
      setResults([]);
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handlePlanTrip} className="space-y-3">
        <div className="relative">
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={isLocating}
            className="mb-1 flex items-center gap-1 text-[10px] font-bold text-[#2B4B9E] disabled:opacity-50"
          >
            <Locate className={`h-3.5 w-3.5 ${isLocating ? "animate-pulse" : ""}`} />
            {isLocating ? "Locating..." : "Use current location"}
          </button>
          <PlaceAutocomplete
            value={origin}
            onChange={(val) => {
              setOrigin(val);
              setRoutingOrigin(null);
            }}
            onSelect={(item: AutocompleteItem) => {
              if (item.type === "route" && item.startStop && item.endStop) {
                setOrigin(item.startStop);
                setDestination(item.endStop);
              }
            }}
            placeholder="Origin — e.g. Megenagna"
            required
            icon={<div className="h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-500" />}
          />
        </div>
        {locationStatus && <p className="text-[10px] font-semibold text-slate-500">{locationStatus}</p>}

        <div className="relative">
          <PlaceAutocomplete
            value={destination}
            onChange={setDestination}
            onSelect={(item: AutocompleteItem) => {
              if (item.type === "route" && item.startStop && item.endStop) {
                if (!origin) setOrigin(item.startStop);
                setDestination(item.endStop);
              }
            }}
            placeholder="Destination — e.g. Mexico Square"
            required
            icon={<MapPin className="h-3.5 w-3.5 text-[#2B4B9E]" />}
          />
        </div>

        <button
          type="submit"
          disabled={isPlanning}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2B4B9E] px-4 py-3 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#1e3570] disabled:opacity-50"
        >
          {isPlanning ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Finding routes…</span>
            </>
          ) : (
            <>
              <Navigation className="h-3.5 w-3.5" />
              <span>Search routes</span>
            </>
          )}
        </button>
      </form>

      {results && (
        <div className="space-y-2 border-t border-slate-100 pt-3">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
            {results.length > 0 ? `Best options (${results.length})` : "No matching routes found"}
          </p>
          {results.map((plan) => {
            const isSelected = selectedRouteId === plan.id;
            const isDirect = !plan.isMergedRoute && plan.transfers === 0;

            return (
              <div
                key={plan.id}
                className={`w-full rounded-2xl border p-3.5 transition-all bg-white flex flex-col gap-2.5 ${
                  isSelected
                    ? "border-[#2B4B9E] ring-2 ring-[#2B4B9E]/20 shadow-sm"
                    : "border-slate-200/90 hover:border-slate-300 shadow-2xs"
                }`}
              >
                {/* Header: Route name, badges, and fare */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-black text-slate-900 truncate">
                        {plan.routeName}
                      </span>
                      <span
                        className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                          isDirect
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-sky-50 text-[#2B4B9E] border border-sky-200"
                        }`}
                      >
                        {isDirect ? "Direct Line" : `${plan.transfers} Transfer`}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] font-bold text-slate-600 mt-1">
                      <span className="truncate">{plan.originStop}</span>
                      <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{plan.destinationStop}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="block text-xs font-black text-[#2B4B9E]">~{plan.totalTimeMin} min</span>
                    <span className="text-[10px] font-bold text-slate-500">{plan.fare}</span>
                  </div>
                </div>

                {/* Departure ETA & Walking Pill */}
                <div className="flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-100">
                  <span className="text-slate-600 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#2B4B9E]" />
                    Bus: <strong className="text-emerald-700">~{plan.nextDepartureMin}m</strong>
                  </span>
                  <span className="text-slate-600 font-medium flex items-center gap-1">
                    <Footprints className="w-3 h-3 text-amber-600" />
                    Walk: <strong className="text-slate-800">~{plan.walkingMinutes || 3}m</strong>
                  </span>
                  {!isDirect && (
                    <span className="text-[10px] text-amber-700 font-bold">
                      Switch bus
                    </span>
                  )}
                </div>

                {/* ── CARD ACTION BUTTONS: DETAIL & SELECT ROUTE ── */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setDetailedPlan(plan)}
                    className="flex-1 py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs"
                  >
                    <Info className="w-3.5 h-3.5 text-[#2B4B9E]" />
                    <span>Detail</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectRoute(plan)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-2xs text-white ${
                      isSelected
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-[#2B4B9E] hover:bg-[#1e3570]"
                    }`}
                  >
                    <span>{isSelected ? "Selected ✓" : "Select Route"}</span>
                    {!isSelected && <ArrowRight className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Trip Plan Detail Popover */}
      {detailedPlan && (
        <TripPlanDetailPopover
          plan={detailedPlan}
          isOpen={Boolean(detailedPlan)}
          onClose={() => setDetailedPlan(null)}
          onSelectRoute={(p) => {
            setDetailedPlan(null);
            handleSelectRoute(p as TripPlan);
          }}
        />
      )}
    </div>
  );
};

// ─── Bus Stop Panel ───────────────────────────────────────────────────────────
const BusStopPanel: React.FC<{ onRouteSelected?: () => void }> = ({ onRouteSelected }) => {
  const [selectedStop, setSelectedStop] = useState<BusStop | null>(null);

  const handleTrackBus = (bus: IncomingBus, stop: BusStop) => {
    window.dispatchEvent(
      new CustomEvent("sbts:select_route", {
        detail: {
          selectedRoute: {
            id: bus.busId,
            busNumber: bus.routeNumber,
            routeVia: `${stop.name} → ${bus.destination}`,
            totalTripMinutes: bus.etaMinutes + 15,
            fare: "15.00 ETB",
            nearestStation: { name: stop.name, walkTimeMinutes: 3 },
          },
          origin: stop.name,
          destination: bus.destination,
          viaStops: [stop.name, "Corridor Station", bus.destination],
        },
      })
    );
    if (onRouteSelected) onRouteSelected();
  };

  if (selectedStop) {
    const incomingBuses = INCOMING_BUSES[selectedStop.id] || [];
    return (
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setSelectedStop(null)}
          className="flex items-center gap-1 text-xs font-bold text-[#2B4B9E] hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to all stops
        </button>

        <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
          <h4 className="text-xs font-black text-slate-900">{selectedStop.name}</h4>
          <p className="text-[10px] text-slate-500">Lines: {selectedStop.routes.join(" • ")}</p>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide">
            Live Incoming Buses ({incomingBuses.length})
          </p>
          {incomingBuses.map((bus) => (
            <div key={bus.busId} className="p-3 rounded-xl border border-slate-200 bg-white flex items-center justify-between gap-2 shadow-2xs">
              <div>
                <p className="text-xs font-black text-slate-900">{bus.routeNumber}</p>
                <p className="text-[10px] text-slate-500">➜ {bus.destination}</p>
                <p className="text-[9px] font-mono text-slate-400">{bus.busId}</p>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-emerald-600 block">~{bus.etaMinutes}m ETA</span>
                <button
                  type="button"
                  onClick={() => handleTrackBus(bus, selectedStop)}
                  className="mt-1 px-2.5 py-1 bg-[#2B4B9E] text-white text-[10px] font-bold rounded-lg cursor-pointer hover:bg-[#1e3570]"
                >
                  Track Bus
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">Nearby stops</span>
        <span className="text-[10px] font-bold text-slate-400">Live ETAs</span>
      </div>
      {NEARBY_STOPS.map((stop) => (
        <button
          key={stop.id}
          type="button"
          onClick={() => setSelectedStop(stop)}
          className="flex w-full items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-3 text-left transition hover:border-[#2B4B9E] hover:bg-blue-50/30"
        >
          <div className="min-w-0">
            <p className="truncate text-xs font-extrabold text-slate-900">{stop.name}</p>
            <p className="mt-1 truncate text-[10px] text-slate-400">{stop.routes.join(" • ")}</p>
          </div>
          <span className="shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-slate-500">
            {stop.distanceMeters}m
          </span>
        </button>
      ))}
    </div>
  );
};

// ─── Standardized Metric Cards Component (for both Desktop & Mobile) ───────────
const AiPredictionCards: React.FC<{ telemetry: ActiveRouteTelemetry }> = ({ telemetry }) => {
  const prediction = telemetry.routeAiPrediction;
  const trafficLevel = prediction?.traffic_level || "Moderate Congestion";
  const isHeavy = trafficLevel.toLowerCase().includes("heavy") || trafficLevel.toLowerCase().includes("congest");
  const isNormal = trafficLevel.toLowerCase().includes("normal") || trafficLevel.toLowerCase().includes("light");

  const trafficStatusColor = isHeavy
    ? "text-amber-700 bg-amber-50 border-amber-200"
    : isNormal
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : "text-amber-700 bg-amber-50 border-amber-200";

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide">AI Fleet Intelligence</h4>
        </div>
        <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Zap className="w-2.5 h-2.5 text-emerald-600" />
          <span>Inference ~{prediction?.processing_time_ms ?? 1.8}ms</span>
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5">
        <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex items-start justify-between gap-3 hover:-translate-y-0.5 transition-transform">
          <div className="min-w-0 space-y-1">
            <h5 className="text-sm font-semibold text-slate-800">Traffic &amp; Congestion</h5>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black px-2 py-0.5 rounded-lg border ${trafficStatusColor}`}>
                {trafficLevel}
              </span>
              <span className="text-[11px] text-slate-500 font-bold">
                Rec: ~{prediction?.recommended_speed_kmh ?? 42} km/h
              </span>
            </div>
          </div>
          <span className="text-[10px] font-black text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-2 py-0.5 rounded-lg shrink-0">
            {prediction ? Math.round(prediction.traffic_confidence * 100) : 94}% AI
          </span>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex items-start justify-between gap-3 hover:-translate-y-0.5 transition-transform">
          <div className="min-w-0 space-y-1">
            <h5 className="text-sm font-semibold text-slate-800">Smart ETA &amp; Arrival</h5>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-black text-[#2B4B9E]">
                ~{prediction ? Math.round(prediction.estimated_duration_minutes) : 22} min
              </span>
              <span className="text-xs text-slate-500 font-bold">
                (ETA {prediction ? prediction.estimated_arrival : "02:54 PM"})
              </span>
            </div>
            <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              <span>{prediction ? prediction.delay_risk : "Minimal Delay Risk (+0m)"}</span>
            </p>
          </div>
          <div className="p-2 rounded-xl bg-blue-50 text-[#2B4B9E] shrink-0">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl border border-slate-200/90 bg-white shadow-sm flex items-start justify-between gap-3 hover:-translate-y-0.5 transition-transform">
          <div className="min-w-0 space-y-1">
            <h5 className="text-sm font-semibold text-slate-800">Fleet Capacity &amp; Comfort</h5>
            <p className="text-xs font-black text-slate-900">
              {prediction ? prediction.crowd_forecast : "Comfortable Seating Available"}
            </p>
            <p className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>AI Route Optimization Active</span>
            </p>
          </div>
          <div className="p-2 rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── CollapsibleSidePanel (Main Export) ──────────────────────────────────────
export const CollapsibleSidePanel: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<"trip" | "stops">("trip");
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>("trip");
  const [searchQuery, setSearchQuery] = useState("");

  const [telemetry, setTelemetry] = useState<ActiveRouteTelemetry>({
    hasActiveRoute: false,
    displayRouteId: "",
    displayBusId: "",
    originLabel: "",
    destLabel: "",
    busProgress: 0,
    currentSpeed: 0,
    isTripCompleted: false,
    displayStops: [],
    routeAiPrediction: null,
    routeAiLoading: false,
    isWebSocketActive: false,
  });

  useEffect(() => {
    const handleTelemetry = (e: any) => {
      if (e.detail) {
        setTelemetry(e.detail);
        if (e.detail.hasActiveRoute) {
          setMobileTab("ai");
        } else {
          setMobileTab((curr) => (curr === "ai" ? "trip" : curr));
        }
      }
    };
    window.addEventListener("sbts:active_route_state", handleTelemetry);
    return () => window.removeEventListener("sbts:active_route_state", handleTelemetry);
  }, []);

  // Open side panel and expand view when a route is selected (e.g. from header search)
  useEffect(() => {
    const handleRouteSelected = (e: any) => {
      if (e.detail?.selectedRoute) {
        setCollapsed(false);
        setIsMobileExpanded(true);
      }
    };
    window.addEventListener("sbts:select_route", handleRouteSelected);
    return () => window.removeEventListener("sbts:select_route", handleRouteSelected);
  }, []);

  // Trigger map tile resize whenever sidebar collapses or expands
  useEffect(() => {
    const t1 = setTimeout(() => window.dispatchEvent(new Event("resize")), 60);
    const t2 = setTimeout(() => window.dispatchEvent(new Event("resize")), 320);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [collapsed]);

  const handleChangeRoute = () => {
    setCollapsed(false);
    setActiveTab("trip");
    setMobileTab("trip");
    setIsMobileExpanded(true);
    setTelemetry((prev) => ({
      ...prev,
      hasActiveRoute: false,
      isTripCompleted: false,
      displayRouteId: "",
      displayBusId: "",
      originLabel: "",
      destLabel: "",
      displayStops: [],
    }));
    window.dispatchEvent(new CustomEvent("sbts:select_route", { detail: { selectedRoute: null } }));
  };

  const DesktopPanel = (
    <aside
      className={`hidden md:flex flex-col h-full bg-white border-r border-slate-200/90 shadow-lg z-20 flex-shrink-0 transition-all duration-300 ease-in-out ${
        collapsed ? "w-16" : "w-[390px] lg:w-[420px]"
      }`}
    >
      <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3.5">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2B4B9E] text-white shadow-sm">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-900">
                Transit
              </h3>
              <p className="text-[10px] font-semibold text-slate-400">Live route board</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          title={collapsed ? "Expand Sidebar (>)" : "Collapse Sidebar (<)"}
        >
          {collapsed ? <ChevronRight className="h-4 w-4 text-[#2B4B9E]" /> : <ChevronLeft className="h-4 w-4 text-slate-600" />}
        </button>
      </div>

      {collapsed ? (
        <div className="flex flex-col items-center gap-3 pt-4 px-2">
          <button
            onClick={() => { setCollapsed(false); setActiveTab("trip"); }}
            className="p-2.5 rounded-2xl bg-blue-50 text-[#2B4B9E] hover:bg-blue-100 transition-all cursor-pointer shadow-xs"
            title="Plan a Trip"
          >
            <Navigation className="w-5 h-5" />
          </button>
          <button
            onClick={() => { setCollapsed(false); setActiveTab("stops"); }}
            className="p-2.5 rounded-2xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all cursor-pointer shadow-xs"
            title="Find Bus Stop"
          >
            <MapPin className="w-5 h-5" />
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-y-auto p-4 space-y-4">
          {telemetry.hasActiveRoute && !telemetry.isTripCompleted ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-900 text-white shadow-lg space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-0.5 rounded-full backdrop-blur-xs">
                    {telemetry.displayBusId || "SBTS-BUS-114"}
                  </span>
                  <span className="text-[10px] font-black text-emerald-300 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    LIVE EN ROUTE
                  </span>
                </div>
                
                <div>
                  <h4 className="text-base font-black text-white">{telemetry.displayRouteId}</h4>
                  <p className="text-xs text-blue-200 font-bold mt-0.5">
                    {telemetry.originLabel} ➜ {telemetry.destLabel}
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  <span className="text-blue-200 font-semibold">Speed: <strong>{telemetry.currentSpeed} km/h</strong></span>
                  <button
                    type="button"
                    onClick={handleChangeRoute}
                    className="text-[10px] font-bold text-white/80 hover:text-white underline cursor-pointer"
                  >
                    Change Route
                  </button>
                </div>
              </div>

              <AiPredictionCards telemetry={telemetry} />

              {telemetry.displayStops && telemetry.displayStops.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <h5 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide">Corridor Stations</h5>
                  <div className="space-y-2">
                    {telemetry.displayStops.map((stop: any, idx: number) => {
                      const isNext = stop.status === "current";
                      const isPassed = stop.status === "completed";
                      return (
                        <div key={stop.id || idx} className="flex items-center justify-between text-xs p-2 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black text-white ${
                              isNext ? "bg-emerald-600 animate-pulse" : isPassed ? "bg-slate-400" : "bg-[#2B4B9E]"
                            }`}>
                              {idx + 1}
                            </span>
                            <span className={`font-bold ${isNext ? "text-emerald-700" : "text-slate-800"}`}>{stop.name}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-bold">{stop.time}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex p-1 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setActiveTab("trip")}
                  className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "trip" ? "bg-white text-[#2B4B9E] shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Plan a Trip</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("stops")}
                  className={`flex-1 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeTab === "stops" ? "bg-white text-emerald-700 shadow-xs" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Find Bus Stop</span>
                </button>
              </div>

              {activeTab === "trip" ? <TripPlannerPanel /> : <BusStopPanel />}
            </div>
          )}
        </div>
      )}
    </aside>
  );

  const MobileSheet = (
    <div className="md:hidden">
      <div className="fixed inset-x-4 top-[72px] z-[60] mx-auto max-w-md">
        <div className="relative flex items-center">
          <Search className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsMobileExpanded(true)}
            placeholder="Where to?"
            className="w-full rounded-2xl border border-slate-200 bg-white/95 py-2.5 pl-9 pr-10 text-xs font-bold text-slate-900 outline-none shadow-[0_10px_30px_-18px_rgba(15,23,42,0.45)] transition focus:border-[#2B4B9E] focus:bg-white"
          />
          {searchQuery ? (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 p-0.5 text-slate-400">
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button onClick={() => setIsMobileExpanded(!isMobileExpanded)} className="absolute right-3 p-0.5 text-slate-400">
              {isMobileExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>

      <div
        className={`fixed inset-x-2 bottom-2 z-40 mx-auto max-w-md bg-white/95 backdrop-blur-md rounded-[22px] shadow-[0_16px_36px_-18px_rgba(15,23,42,0.34)] border border-slate-200 transition-all duration-300 flex flex-col ${
          isMobileExpanded ? "h-[74vh]" : "h-[18vh]"
        }`}
      >
        <div 
          onClick={() => setIsMobileExpanded(!isMobileExpanded)}
          className="pt-2 pb-1 px-4 cursor-pointer select-none shrink-0 text-center"
        >
          <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto" />
        </div>

        <div className="flex shrink-0 items-center gap-2 overflow-x-auto px-3 py-1 no-scrollbar">
          <button
            type="button"
            onClick={() => { setMobileTab("trip"); setIsMobileExpanded(true); }}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-black transition-all ${
              mobileTab === "trip"
                ? "bg-[#2B4B9E] text-white shadow-sm"
                : "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Navigation className="h-3.5 w-3.5" />
              <span>Plan a Trip</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setMobileTab("stops"); setIsMobileExpanded(true); }}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-black transition-all ${
              mobileTab === "stops"
                ? "bg-emerald-600 text-white shadow-sm"
                : "border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              <span>Find Bus Stop</span>
            </span>
          </button>
          {telemetry.hasActiveRoute && (
            <button
              type="button"
              onClick={() => { setMobileTab("ai"); }}
              className={`shrink-0 rounded-full px-3 py-2 text-xs font-black transition-all ${
                mobileTab === "ai"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "border border-indigo-200 bg-indigo-50 text-indigo-700"
              }`}
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>AI</span>
              </span>
            </button>
          )}
        </div>

        {/* Sheet Scrollable Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-3 space-y-3">
          {mobileTab === "ai" && telemetry.hasActiveRoute ? (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-blue-900 to-indigo-900 text-white flex items-center justify-between shadow-md">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black">{telemetry.displayRouteId}</span>
                    <span className="text-[9px] font-bold bg-white/20 px-2 py-0.2 rounded-md">
                      {telemetry.displayBusId}
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-200 font-bold mt-0.5">{telemetry.originLabel} ➜ {telemetry.destLabel}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-emerald-400 block">{telemetry.currentSpeed} km/h</span>
                  <span className="text-[9px] font-bold text-slate-300">Live Speed</span>
                  <button
                    type="button"
                    onClick={handleChangeRoute}
                    className="mt-1 text-[10px] font-bold text-white/80 underline hover:text-white"
                  >
                    Change Route
                  </button>
                </div>
              </div>
              <AiPredictionCards telemetry={telemetry} />
            </div>
          ) : mobileTab === "trip" ? (
            <TripPlannerPanel initialQuery={searchQuery} onRouteSelected={() => setIsMobileExpanded(false)} />
          ) : (
            <BusStopPanel onRouteSelected={() => setIsMobileExpanded(false)} />
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {DesktopPanel}
      {MobileSheet}
    </>
  );
};

export default CollapsibleSidePanel;
