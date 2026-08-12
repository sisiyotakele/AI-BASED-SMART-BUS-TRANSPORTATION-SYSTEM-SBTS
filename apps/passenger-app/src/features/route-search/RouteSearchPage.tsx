import React, { useState, useEffect } from "react";
import {
  Navigation,
  MapPin,
  Search,
  Locate,
  Loader2,
  GitMerge,
  CheckCircle2,
  Info,
  Bus,
  Clock,
  AlertTriangle,
  Radio,
  RefreshCw,
  ArrowLeftRight,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RouteOption } from "./types";
import { RouteOptionCard } from "./RouteOptionCard";
import { RouteDetailPopover } from "./RouteDetailPopover";
import { BusTrackingModal } from "./BusTrackingModal";
import { routesApi, aiIntegrationApi, AiCombinedPrediction } from "@/lib/api";

/* ─────────────────────────────────────────────
   STOP FINDER DATA TYPES & MOCKS
   ───────────────────────────────────────────── */
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
  { id: "s1", name: "Mexico Square Stop", distanceMeters: 150, routes: ["Bus 101", "Bus 204"] },
  { id: "s2", name: "Meskel Square Station", distanceMeters: 450, routes: ["Bus 101", "Bus 305"] },
  { id: "s3", name: "Stadium Terminal", distanceMeters: 800, routes: ["Bus 204", "Bus 305"] },
  { id: "s4", name: "Megenagna Interchange", distanceMeters: 1200, routes: ["Bus 12", "Bus 08"] },
  { id: "s5", name: "Bole Airport Terminal 2", distanceMeters: 1800, routes: ["Bus 12", "Bus 101"] },
];

const MOCK_INCOMING: Record<string, IncomingBus[]> = {
  s1: [
    { busId: "SH-204", routeNumber: "Bus 101", destination: "Tor Hailoch", etaMinutes: 3, status: "On Time" },
    { busId: "SH-108", routeNumber: "Bus 204", destination: "Piyassa", etaMinutes: 9, status: "Delayed", delayReason: "Heavy traffic at Mexico Roundabout" },
    { busId: "SH-099", routeNumber: "Bus 101", destination: "Megenagna", etaMinutes: 0, status: "Offline", delayReason: "GPS signal lost" },
  ],
  s2: [
    { busId: "SH-312", routeNumber: "Bus 305", destination: "CMC", etaMinutes: 5, status: "On Time" },
    { busId: "SH-114", routeNumber: "Bus 101", destination: "Bole Airport", etaMinutes: 12, status: "On Time" },
  ],
  s3: [{ busId: "SH-402", routeNumber: "Bus 204", destination: "Akaki", etaMinutes: 4, status: "On Time" }],
  s4: [
    { busId: "SH-114", routeNumber: "Bus 12", destination: "Bole", etaMinutes: 2, status: "On Time" },
    { busId: "SH-882", routeNumber: "Bus 08", destination: "Stadium", etaMinutes: 7, status: "Delayed", delayReason: "Passenger crowd delay" },
  ],
  s5: [{ busId: "SH-991", routeNumber: "Bus 12", destination: "Megenagna", etaMinutes: 6, status: "On Time" }],
};

/* ─────────────────────────────────────────────
   MAIN UNIFIED PAGE
   ───────────────────────────────────────────── */
type ActiveTab = "plan" | "stops";

export const RouteSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ActiveTab>("plan");

  // ── TRIP PLANNER STATE ──────────────────────
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<{ routes: RouteOption[]; usedFallback: boolean } | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  // ── AI PREDICTION STATE ──────────────────────
  const [aiMetrics, setAiMetrics] = useState<AiCombinedPrediction>({
    traffic_load_percentage: 65,
    congestion_level: "Moderate",
    estimated_delay_minutes: 8,
    recommended_speed_kmh: 40,
    best_departure_time: "Now",
    confidence_score: 91,
  });

  // ── STOP FINDER STATE ───────────────────────
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);
  const [stopQuery, setStopQuery] = useState("");
  const [selectedStop, setSelectedStop] = useState<BusStop>(MOCK_STOPS[0]);
  const [subscribedBus, setSubscribedBus] = useState<string | null>(null);
  const [popoverBus, setPopoverBus] = useState<{ bus: IncomingBus; stop: BusStop } | null>(null);
  const [trackingBus, setTrackingBus] = useState<{ bus: IncomingBus; stop: BusStop } | null>(null);

  // Request location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => setLocationGranted(true),
        () => setLocationGranted(false)
      );
    } else {
      setLocationGranted(false);
    }
  }, []);

  /* ── TRIP PLANNER HANDLERS ────────────────── */
  const handleDetectLocation = () => {
    setIsLocating(true);
    setLocationStatus(null);
    if (!navigator.geolocation) {
      setLocationStatus("Geolocation not supported. Please type your starting location.");
      setIsLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setOrigin(`My Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`);
        setLocationStatus("GPS location detected!");
        setIsLocating(false);
      },
      () => {
        setLocationStatus("Could not get GPS location. Please type manually.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const executeSearch = async (searchOrigin: string, searchDest: string) => {
    if (!searchDest.trim()) return;
    setIsSearching(true);
    setSelectedRouteId(null);

    const A = searchOrigin.trim() || "Your Location";
    const D = searchDest.trim();

    // Call live AI prediction service endpoints
    try {
      const aiRes = await aiIntegrationApi.predictCombined({
        origin_lat: 9.02,
        origin_lon: 38.75,
        dest_lat: 8.99,
        dest_lon: 38.79,
        timestamp: new Date().toISOString(),
      });

      if (aiRes.data?.success && aiRes.data?.data) {
        const data = aiRes.data.data;
        setAiMetrics({
          traffic_load_percentage: data.traffic_load_percentage ?? 68,
          congestion_level: data.congestion_level ?? "Moderate",
          estimated_delay_minutes: data.estimated_delay_minutes ?? 7,
          recommended_speed_kmh: data.recommended_speed_kmh ?? 42,
          best_departure_time: data.best_departure_time ?? "Now",
          confidence_score: data.confidence_score ?? 93,
        });
      }
    } catch (err) {
      console.warn("Using baseline AI prediction fallback:", err);
    }

    const queryLower = (A + " " + D).toLowerCase();

    // Check if user searched for a transfer scenario (e.g. Ayat -> Tor Hailoch, or CMC -> Jemmo)
    const isTransferOnlyScenario = 
      queryLower.includes("ayat") || 
      queryLower.includes("tor hailoch") ||
      queryLower.includes("cmc") ||
      queryLower.includes("jemmo") ||
      queryLower.includes("transfer");

    // ── DIRECT ROUTES ─────────────────────────────────────────────
    const directRoutes: RouteOption[] = isTransferOnlyScenario ? [] : [
      {
        id: "direct-via-B",
        isMergedRoute: false,
        transfersCount: 0,
        busNumber: "Bus 12 Express",
        busType: "Anbessa Euro 5",
        routeVia: `${A} → Mexico Square → ${D}`,
        nearestStation: {
          id: "st-d1",
          name: "Mexico Square Stop",
          distanceMeters: 320,
          walkTimeMinutes: 4,
          coords: { lat: 9.02, lng: 38.75 },
        },
        busEtaMinutes: 6,
        totalTripMinutes: 24,
        fare: "15.00 ETB",
        crowdLevel: "High",
      },
      {
        id: "direct-via-C",
        isMergedRoute: false,
        transfersCount: 0,
        busNumber: "Bus 08 Rapid",
        busType: "Sheger Express Bus",
        routeVia: `${A} → Stadium Terminal → ${D}`,
        nearestStation: {
          id: "st-d2",
          name: "Stadium Terminal",
          distanceMeters: 510,
          walkTimeMinutes: 7,
          coords: { lat: 9.018, lng: 38.753 },
        },
        busEtaMinutes: 10,
        totalTripMinutes: 30,
        fare: "12.00 ETB",
        crowdLevel: "Low",
      },
      {
        id: "direct-via-E",
        isMergedRoute: false,
        transfersCount: 0,
        busNumber: "Bus 34 Line",
        busType: "Anbessa Standard",
        routeVia: `${A} → Megenagna Interchange → ${D}`,
        nearestStation: {
          id: "st-d3",
          name: "Megenagna Interchange Stop",
          distanceMeters: 750,
          walkTimeMinutes: 10,
          coords: { lat: 9.025, lng: 38.76 },
        },
        busEtaMinutes: 3,
        totalTripMinutes: 35,
        fare: "10.00 ETB",
        crowdLevel: "Medium",
      },
    ];

    // ── TRANSFER ROUTES ───────────────────────────
    const transferRoutes: RouteOption[] = [
      {
        id: "transfer-1",
        isMergedRoute: true,
        transfersCount: 1,
        busNumber: "Bus 34 → Bus 12",
        busType: "2-Bus Transfer",
        routeVia: `${A} → Bole Atlas (change bus) → ${D}`,
        nearestStation: {
          id: "st-t1",
          name: "Bole Atlas Stop",
          distanceMeters: 380,
          walkTimeMinutes: 5,
          coords: { lat: 9.02, lng: 38.77 },
        },
        busEtaMinutes: 7,
        totalTripMinutes: 38,
        fare: "25.00 ETB",
        crowdLevel: "Low",
        legs: [
          { legIndex: 1, fromStation: A, toStation: "Bole Atlas Stop", busNumber: "Bus 34 Line", busType: "Sheger Express", departureEtaMinutes: 7, durationMinutes: 18, fare: "12.00 ETB" },
          { legIndex: 2, fromStation: "Bole Atlas Stop", toStation: D, busNumber: "Bus 12 Express", busType: "Anbessa Euro 5", departureEtaMinutes: 4, durationMinutes: 15, fare: "13.00 ETB", transferWaitMinutes: 5 },
        ],
      },
      {
        id: "transfer-2",
        isMergedRoute: true,
        transfersCount: 2,
        busNumber: "Bus 08 → Bus 04 → Bus 12",
        busType: "3-Bus Transfer",
        routeVia: `${A} → Stadium (change) → Mexico Sq (change) → ${D}`,
        nearestStation: {
          id: "st-t2",
          name: "Mexico Square Terminal",
          distanceMeters: 220,
          walkTimeMinutes: 3,
          coords: { lat: 9.01, lng: 38.75 },
        },
        busEtaMinutes: 4,
        totalTripMinutes: 48,
        fare: "30.00 ETB",
        crowdLevel: "Medium",
        legs: [
          { legIndex: 1, fromStation: A, toStation: "Stadium Stop", busNumber: "Bus 08 Akaki", busType: "Anbessa Euro 5", departureEtaMinutes: 4, durationMinutes: 14, fare: "10.00 ETB" },
          { legIndex: 2, fromStation: "Stadium Stop", toStation: "Mexico Square", busNumber: "Bus 04 Rapid", busType: "Sheger Express", departureEtaMinutes: 3, durationMinutes: 10, fare: "8.00 ETB", transferWaitMinutes: 4 },
          { legIndex: 3, fromStation: "Mexico Square", toStation: D, busNumber: "Bus 12 Direct", busType: "Anbessa Standard", departureEtaMinutes: 5, durationMinutes: 14, fare: "12.00 ETB", transferWaitMinutes: 5 },
        ],
      },
    ];

    const hasDirectRoutes = directRoutes.length > 0;
    const results = hasDirectRoutes ? directRoutes : transferRoutes;

    setSearchResults({ routes: results, usedFallback: !hasDirectRoutes });
    setIsSearching(false);
  };


  const handleSearchTrip = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(origin, destination);
  };

  const handleApplyExample = (exOrigin: string, exDest: string) => {
    setOrigin(exOrigin);
    setDestination(exDest);
    executeSearch(exOrigin, exDest);
  };

  /* ── STOP FINDER HELPERS ──────────────────── */
  const filteredStops = MOCK_STOPS.filter(
    (s) =>
      s.name.toLowerCase().includes(stopQuery.toLowerCase()) ||
      s.routes.some((r) => r.toLowerCase().includes(stopQuery.toLowerCase()))
  );
  const incomingBuses = MOCK_INCOMING[selectedStop.id] || [];

  const statusColors: Record<string, string> = {
    "On Time": "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
    Delayed: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    Offline: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  };

  return (
    <div className="w-full space-y-6">

      {/* ── PAGE HEADER WITH BACK TO HOME BUTTON ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Smart Transit Hub
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-1 font-medium">
            Plan your journey or find live bus stop ETAs — all in one place.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-white text-sm sm:text-base font-extrabold rounded-xl shadow-xs transition-all cursor-pointer hover:opacity-90"
            style={{ backgroundColor: "#2B4B9E" }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Home</span>
          </button>
          <button
            onClick={() => { setSearchResults(null); setStopQuery(""); setOrigin(""); setDestination(""); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-sm sm:text-base font-bold transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* ── TAB SWITCHER ────────────────────────── */}
      <div className="flex gap-2 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-fit">
        <button
          onClick={() => setActiveTab("plan")}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm sm:text-base font-extrabold transition-all cursor-pointer ${
            activeTab === "plan"
              ? "text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
          style={activeTab === "plan" ? { backgroundColor: "#2B4B9E" } : undefined}
        >
          <Navigation className="w-5 h-5" />
          Plan a Trip
        </button>
        <button
          onClick={() => setActiveTab("stops")}
          className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl text-sm sm:text-base font-extrabold transition-all cursor-pointer ${
            activeTab === "stops"
              ? "text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
          style={activeTab === "stops" ? { backgroundColor: "#2B4B9E" } : undefined}
        >
          <MapPin className="w-4 h-4" />
          Find Bus Stops
        </button>
      </div>

      {/* ══════════════════════════════════════════
          TAB 1 — TRIP PLANNER
      ══════════════════════════════════════════ */}
      {activeTab === "plan" && (
        <div className="space-y-6">
          {/* Search Form */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
                <Navigation className="w-6 h-6" style={{ color: "#2B4B9E" }} />
                Trip Planner & Transit Routes
              </h2>
              <span className="bg-indigo-50 border text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-full flex items-center gap-1.5" style={{ color: "#2B4B9E", borderColor: "#2B4B9E33" }}>
                <GitMerge className="w-4 h-4" />
                Direct & Transfer Options
              </span>
            </div>

            <form onSubmit={handleSearchTrip} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Origin */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-extrabold text-slate-800">Starting Point</label>
                    <button
                      type="button"
                      onClick={handleDetectLocation}
                      disabled={isLocating}
                      className="text-xs sm:text-sm font-bold hover:underline flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      style={{ color: "#2B4B9E" }}
                    >
                      {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
                      {isLocating ? "Detecting GPS..." : "Use My Location"}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter origin (e.g. Akaki, Mexico, Bole)..."
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-sm sm:text-base font-semibold rounded-xl pl-11 pr-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2B4B9E]/20 transition-all"
                    />
                    <Locate className="w-5 h-5 absolute left-3.5 top-3.5" style={{ color: "#2B4B9E" }} />
                  </div>
                </div>

                {/* Destination */}
                <div className="space-y-2">
                  <label className="text-sm font-extrabold text-slate-800">Destination</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Where are you going? (e.g. Megenagna, Tor Hailoch)"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      required
                      className="w-full bg-slate-50 border border-slate-200 text-sm sm:text-base font-semibold rounded-xl pl-11 pr-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2B4B9E]/20 transition-all"
                    />
                    <MapPin className="w-5 h-5 text-rose-500 absolute left-3.5 top-3.5" />
                  </div>
                </div>
              </div>

              {/* EXAMPLE PLACE NAMES TO SEE DIRECT VS TRANSFER ROUTES */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                <p className="text-xs sm:text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <Info className="w-4 h-4" style={{ color: "#2B4B9E" }} />
                  Sample Place Names (Click to test Direct vs. Transfer routes):
                </p>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleApplyExample("Mexico Square", "Bole Airport")}
                    className="text-xs sm:text-sm font-bold px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span><strong>Direct Route Example:</strong> Mexico Square → Bole Airport</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyExample("Ayat", "Tor Hailoch")}
                    className="text-xs sm:text-sm font-bold px-4 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-[#0c8cb4] border border-sky-300 transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: "#12B2E4" }}></span>
                    <span><strong>Transfer Route Example:</strong> Ayat → Tor Hailoch</span>
                  </button>
                </div>
              </div>

              {locationStatus && (
                <p className="text-xs sm:text-sm text-slate-600 flex items-center gap-2 font-medium">
                  <Info className="w-4 h-4 shrink-0" style={{ color: "#2B4B9E" }} />
                  {locationStatus}
                </p>
              )}

              <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
                <button
                  type="submit"
                  disabled={isSearching || !destination}
                  className="w-full sm:w-auto text-white text-sm sm:text-base font-extrabold px-10 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 hover:opacity-90"
                  style={{ backgroundColor: isSearching || !destination ? undefined : "#2B4B9E" }}
                >
                  {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
                  {isSearching ? "Finding routes..." : "Find Routes"}
                </button>
                {(origin || destination) && (
                  <button
                    type="button"
                    onClick={() => { setOrigin(""); setDestination(""); setSearchResults(null); setLocationStatus(null); }}
                    className="text-sm text-slate-500 hover:text-slate-700 font-bold cursor-pointer flex items-center gap-1.5"
                  >
                    <ArrowLeftRight className="w-4 h-4" /> Clear
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Route Results */}
          {searchResults && (
            <div className="space-y-4">
              {/* SINGLE LINE BANNER WHEN NO DIRECT ROUTE ONLY TRANSFER */}
              {searchResults.usedFallback ? (
                <div className="bg-sky-50/80 border border-sky-200 rounded-2xl px-5 py-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-sm sm:text-base font-black text-slate-900">
                    <GitMerge className="w-5 h-5 shrink-0" style={{ color: "#12B2E4" }} />
                    <span>No direct route, only transfer options available</span>
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold px-3.5 py-1.5 rounded-full text-white shrink-0 self-start sm:self-auto" style={{ backgroundColor: "#12B2E4" }}>
                    {searchResults.routes.length} Transfer Options
                  </span>
                </div>
              ) : (
                <div className="bg-blue-50/80 border rounded-2xl px-5 py-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3" style={{ borderColor: "#2B4B9E33" }}>
                  <div className="flex items-center gap-2.5 text-sm sm:text-base font-black" style={{ color: "#2B4B9E" }}>
                    <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "#2B4B9E" }} />
                    <span>Direct routes available to {destination}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold px-3.5 py-1.5 rounded-full text-white shrink-0 self-start sm:self-auto" style={{ backgroundColor: "#2B4B9E" }}>
                    {searchResults.routes.length} Direct Options
                  </span>
                </div>
              )}

              {/* Cards */}
              <div className="flex gap-4 overflow-x-auto pb-4 -mx-1 px-1">
                {searchResults.routes.map((option) => (
                  <RouteOptionCard
                    key={option.id}
                    option={option}
                    destinationName={destination}
                    isSelected={selectedRouteId === option.id}
                    onSelectRoute={(opt) => { setSelectedRouteId(opt.id); navigate("/dashboard"); }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty state before search */}
          {!searchResults && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400 gap-4 bg-slate-50/60 rounded-2xl border border-slate-200/70 border-dashed p-6">
              <Navigation className="w-12 h-12" style={{ color: "#2B4B9E88" }} />
              <p className="text-base sm:text-lg font-extrabold text-slate-700">Enter your origin and destination or click one of the example places above</p>
              <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md">Direct routes will show first — transfers only appear when no direct bus is available.</p>
            </div>
          )}

          {/* ── AI TRAFFIC PREDICTION PANEL (appears after search results) ── */}
          {searchResults && (
            <div className="rounded-2xl border overflow-hidden shadow-md" style={{ borderColor: "#325B96" }}>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ background: "linear-gradient(135deg, #1C3D6E 0%, #16325C 100%)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl" style={{ backgroundColor: "rgba(56,189,248,0.15)" }}>
                    <Sparkles className="w-5 h-5" style={{ color: "#38BDF8" }} />
                  </div>
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "#38BDF8" }}>AI-Powered Analysis</p>
                    <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                      Traffic Prediction — {origin || "Your Location"} → {destination}
                    </h3>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ backgroundColor: "rgba(56,189,248,0.15)", color: "#7DD3FC", border: "1px solid rgba(56,189,248,0.3)" }}>
                  {aiMetrics.confidence_score ?? 91}% confidence
                </span>
              </div>

              {/* Body */}
              <div className="bg-white p-6 space-y-5">
                {/* Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {/* Traffic Load */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-xs text-slate-500 font-extrabold uppercase tracking-wide">Traffic Load</p>
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="relative w-12 h-12 shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          <path className="text-slate-100" strokeWidth="4" stroke="currentColor" fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                          <path strokeDasharray={`${aiMetrics.traffic_load_percentage ?? 65}, 100`} strokeWidth="4" strokeLinecap="round"
                            stroke="#1C3D6E" fill="none"
                            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-black text-slate-800">{aiMetrics.traffic_load_percentage ?? 65}%</span>
                      </div>
                      <div>
                        <p className="text-base font-extrabold text-slate-900">{aiMetrics.congestion_level ?? "Moderate"}</p>
                        <p className="text-xs text-slate-500 font-medium">on this route</p>
                      </div>
                    </div>
                  </div>

                  {/* Est. Delay */}
                  <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                    <p className="text-xs text-amber-700 font-extrabold uppercase tracking-wide">Est. Delay</p>
                    <p className="text-3xl font-black text-amber-600 mt-1">+{aiMetrics.estimated_delay_minutes ?? 8} <span className="text-base font-bold">min</span></p>
                    <p className="text-xs text-amber-600 mt-0.5 font-medium">Bus 12 corridor</p>
                  </div>

                  {/* Recommended Speed */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                    <p className="text-xs text-slate-500 font-extrabold uppercase tracking-wide">Rec. Speed</p>
                    <p className="text-3xl font-black text-slate-800 mt-1">{aiMetrics.recommended_speed_kmh ?? 40} <span className="text-base font-bold">km/h</span></p>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">Optimal corridor speed</p>
                  </div>

                  {/* Best Departure */}
                  <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                    <p className="text-xs text-emerald-700 font-extrabold uppercase tracking-wide">Best Time</p>
                    <p className="text-3xl font-black text-emerald-600 mt-1 flex items-center gap-1.5">
                      <Zap className="w-5 h-5" />
                      {aiMetrics.best_departure_time ?? "Now"}
                    </p>
                    <p className="text-xs text-emerald-600 mt-0.5 font-medium">Low crowd window</p>
                  </div>
                </div>

                {/* Hourly Bar Chart */}
                <div>
                  <p className="text-xs text-slate-500 font-extrabold uppercase tracking-wide mb-2.5">Hourly Traffic on This Corridor</p>
                  <div className="flex items-end justify-between h-14 gap-1.5">
                    {[30, 50, 75, 90, 65, 40, 35, 55, 70, 85, 60, 45].map((height, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className="w-full rounded-sm transition-all"
                          style={{
                            height: `${height}%`,
                            backgroundColor: height > 75 ? "#1C3D6E" : height > 55 ? "#335990" : "#BFD3F0"
                          }}
                        />
                        <span className="text-xs font-bold text-slate-500">{i + 6}h</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Alternate Route Suggestion */}
                <div className="flex items-center justify-between gap-4 rounded-2xl px-5 py-4" style={{ background: "linear-gradient(90deg, #EFF6FF, #DBEAFE)", border: "1px solid #BFDBFE" }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <TrendingUp className="w-5 h-5 shrink-0" style={{ color: "#1C3D6E" }} />
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-slate-900">AI Suggested Alternate Route</p>
                      <p className="text-xs sm:text-sm text-slate-600 truncate font-medium">Via Sarbet bypass — saves ~6 min over current fastest option</p>
                    </div>
                  </div>
                  <span className="text-xs sm:text-sm font-black whitespace-nowrap shrink-0" style={{ color: "#1C3D6E" }}>89% match</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          TAB 2 — STOP FINDER
      ══════════════════════════════════════════ */}
      {activeTab === "stops" && (
        <div className="space-y-6">
          {/* Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2.5">
                <MapPin className="w-6 h-6" style={{ color: "#2B4B9E" }} />
                Nearby Bus Stops & Real-Time ETAs
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">
                Discover active stations near you with live arrival predictions.
              </p>
            </div>
            <div className="relative w-full sm:w-80 shrink-0">
              <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={stopQuery}
                onChange={(e) => setStopQuery(e.target.value)}
                placeholder="Search stop or route..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-base outline-none focus:border-[#2B4B9E] focus:bg-white transition-all font-semibold"
              />
            </div>
          </div>

          {/* Location Banner */}
          {locationGranted === null && (
            <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Locate className="w-6 h-6 animate-bounce shrink-0" style={{ color: "#2B4B9E" }} />
                <p className="text-sm sm:text-base font-extrabold text-slate-800">
                  Enable GPS to sort nearby stops by real walking distance.
                </p>
              </div>
              <button
                onClick={() => navigator.geolocation.getCurrentPosition(() => setLocationGranted(true), () => setLocationGranted(false))}
                className="px-5 py-3 text-white text-sm font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap"
                style={{ backgroundColor: "#2B4B9E" }}
              >
                Enable Location
              </button>
            </div>
          )}

          {/* Grid: Stops List + Live Dashboard */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left — Stop List */}
            <div className="space-y-4">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-600 flex items-center justify-between">
                <span>Nearby Stations ({filteredStops.length})</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full text-white" style={{ backgroundColor: "#12B2E4" }}>GPS Sorted</span>
              </h3>
              <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
                {filteredStops.length === 0 ? (
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center text-sm font-medium text-slate-500">
                    No stops matched "{stopQuery}".
                  </div>
                ) : (
                  filteredStops.map((stop) => {
                    const isSelected = selectedStop.id === stop.id;
                    return (
                      <div
                        key={stop.id}
                        onClick={() => setSelectedStop(stop)}
                        className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? "border-[#2B4B9E] bg-blue-50/60 shadow-xs ring-2 ring-[#2B4B9E]/20"
                            : "border-slate-200 bg-white hover:border-[#12B2E4]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-extrabold text-slate-900 truncate">{stop.name}</h4>
                          <span className="text-sm font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 ml-2 shrink-0" style={{ color: "#2B4B9E" }}>
                            {stop.distanceMeters}m
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                          {stop.routes.map((r) => (
                            <span key={r} className="text-xs bg-slate-100 text-slate-800 border border-slate-200 px-2.5 py-1 rounded-lg font-bold">
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

            {/* Right — Station Live Dashboard (LIGHTER ROYAL NAVY THEME) */}
            <div className="lg:col-span-2">
              <div
                className="text-white rounded-3xl p-6 sm:p-7 shadow-xl space-y-6 border border-[#325B96] h-full"
                style={{ background: "linear-gradient(180deg, #1C3D6E 0%, #16325C 100%)" }}
              >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-[#325A94]/70 pb-4">
                  <div>
                    <span className="text-xs font-black uppercase tracking-widest block" style={{ color: "#38BDF8" }}>
                      Station Live Dashboard
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2.5 mt-1">
                      <Bus className="w-7 h-7" style={{ color: "#38BDF8" }} />
                      {selectedStop.name}
                    </h3>
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold px-4 py-2 rounded-full border border-[#4873AE]/60 text-white shrink-0 shadow-xs" style={{ backgroundColor: "#294E80" }}>
                    {incomingBuses.length} Incoming Buses
                  </span>
                </div>

                {/* Incoming Buses List */}
                <div className="space-y-4">
                  {incomingBuses.length === 0 ? (
                    <div className="py-14 text-center text-blue-100 text-sm font-medium">
                      No active buses heading toward {selectedStop.name} right now.
                    </div>
                  ) : (
                    incomingBuses.map((bus) => (
                      <div
                        key={bus.busId}
                        className="bg-[#254676]/80 hover:bg-[#2C528B]/90 border border-[#3B67A4]/50 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all shadow-sm"
                      >
                        {/* Left Details */}
                        <div className="space-y-2 min-w-0">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-white text-xs sm:text-sm font-black px-3.5 py-1 rounded-xl shadow-xs" style={{ backgroundColor: "#00B4D8" }}>
                              {bus.routeNumber}
                            </span>
                            <span className="text-base sm:text-lg font-black text-white truncate">To {bus.destination}</span>
                            <span className="text-xs sm:text-sm text-slate-200 font-mono font-bold">({bus.busId})</span>
                          </div>
                          {bus.status === "Delayed" && (
                            <p className="text-xs sm:text-sm text-[#7DD3FC] font-semibold flex items-center gap-1.5 mt-1">
                              <AlertTriangle className="w-4 h-4 text-[#38BDF8]" /> Delayed: {bus.delayReason}
                            </p>
                          )}
                          {bus.status === "Offline" && (
                            <p className="text-xs sm:text-sm text-[#FDA4AF] font-semibold flex items-center gap-1.5 mt-1">
                              <AlertTriangle className="w-4 h-4 text-rose-300" /> Offline: {bus.delayReason}
                            </p>
                          )}
                        </div>

                        {/* Right Actions & ETA */}
                        <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end">
                          <div className="text-right flex flex-col items-end">
                            <div className="text-lg sm:text-xl font-black text-white flex items-center gap-1.5 justify-end">
                              {bus.status === "Offline" ? (
                                "N/A"
                              ) : (
                                <>
                                  <span>{bus.etaMinutes} min</span>
                                  <span className="text-sm font-bold text-slate-100">ETA</span>
                                </>
                              )}
                            </div>
                            <span
                              className={`text-xs px-3 py-0.5 rounded-full font-bold border mt-0.5 inline-block text-center ${
                                bus.status === "On Time"
                                  ? "bg-[#046C4E]/90 text-[#34D399] border-[#059669]/60"
                                  : bus.status === "Delayed"
                                  ? "bg-[#1D4ED8]/80 text-[#93C5FD] border-[#3B82F6]/60"
                                  : "bg-[#9F1239]/80 text-[#FDA4AF] border-[#F43F5E]/60"
                              }`}
                            >
                              {bus.status}
                            </span>
                          </div>

                          {bus.status !== "Offline" && (
                            <div className="flex items-center gap-2.5">
                              <button
                                type="button"
                                onClick={() => setPopoverBus({ bus, stop: selectedStop })}
                                className="px-4 py-2.5 bg-[#335990]/90 hover:bg-[#3D68A6] border border-[#4B79BD]/60 text-white rounded-2xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                              >
                                <Info className="w-4 h-4" style={{ color: "#38BDF8" }} /> Details
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const isTracking = subscribedBus === bus.busId;
                                  setSubscribedBus(isTracking ? null : bus.busId);
                                  if (!isTracking) {
                                    setTrackingBus({ bus, stop: selectedStop });
                                  } else {
                                    setTrackingBus(null);
                                  }
                                }}
                                className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 text-white border shadow-xs ${
                                  subscribedBus === bus.busId
                                    ? "bg-[#059669] border-[#10B981] shadow-md"
                                    : "bg-[#335990]/90 hover:bg-[#3D68A6] border-[#4B79BD]/60"
                                }`}
                              >
                                {subscribedBus === bus.busId ? (
                                  <><CheckCircle2 className="w-4 h-4 text-white" /> Tracking</>
                                ) : (
                                  <><Radio className="w-4 h-4 animate-pulse" style={{ color: "#38BDF8" }} /> Track Live</>
                                )}
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
        </div>
      )}

      {/* ── ROUTE DETAIL POPOVER ─────────────────── */}
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

      {/* ── BUS TRACKING MODAL ───────────────────── */}
      {trackingBus && (
        <BusTrackingModal
          bus={trackingBus.bus}
          stop={trackingBus.stop}
          onClose={() => {
            setTrackingBus(null);
            setSubscribedBus(null);
          }}
        />
      )}
    </div>
  );
};

export default RouteSearchPage;