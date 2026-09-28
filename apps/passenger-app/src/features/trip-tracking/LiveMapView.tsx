// src/features/trip-tracking/LiveMapView.tsx
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  MapPin, 
  Radio, 
  Clock, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  Navigation, 
  Compass,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { trackingApi, aiIntegrationApi } from "@/lib/api";
import { subscribeToAllTracking, BusLocationUpdate } from "@/lib/socket";
import { useLocation } from "react-router-dom";
import { evaluateStopProximity, ProximityAlert } from "@/lib/proximityAlerts";
import { RealGoogleMap } from "./RealGoogleMap";

interface Stop {
  id: string;
  name: string;
  time: string;
  coords: { x: number; y: number };
  passengersWaiting: number;
  status: "completed" | "current" | "upcoming";
}

export interface BusTrackingLocation {
  id: string;
  busId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading?: number;
  timestamp?: string;
}

// Per-route stop definitions for explicit route presets
const ROUTE_PRESETS: Record<string, {
  stops: Stop[];
  routeId: string;
  busId: string;
  originLabel: string;
  destLabel: string;
}> = {
  "Route 12": {
    routeId: "Route 12 Express",
    busId: "SBTS-BUS-114",
    originLabel: "Megenagna",
    destLabel: "Bole Airport",
    stops: [
      { id: "r12-1", name: "Megenagna",       time: "07:00 AM", coords: { x: 8,  y: 42 }, passengersWaiting: 12, status: "completed" },
      { id: "r12-2", name: "CMC Michael",      time: "07:12 AM", coords: { x: 28, y: 35 }, passengersWaiting: 8,  status: "current"   },
      { id: "r12-3", name: "Bole Medhanialem", time: "07:20 AM", coords: { x: 52, y: 48 }, passengersWaiting: 15, status: "upcoming"  },
      { id: "r12-4", name: "Bole Airport",     time: "07:28 AM", coords: { x: 88, y: 38 }, passengersWaiting: 6,  status: "upcoming"  },
    ],
  },
  "Route 04": {
    routeId: "Route 04 Direct",
    busId: "SBTS-BUS-092",
    originLabel: "Tor Hailoch",
    destLabel: "Stadium",
    stops: [
      { id: "r04-1", name: "Tor Hailoch",  time: "08:00 AM", coords: { x: 8,  y: 55 }, passengersWaiting: 18, status: "completed" },
      { id: "r04-2", name: "Sarbet",        time: "08:08 AM", coords: { x: 30, y: 42 }, passengersWaiting: 10, status: "current"   },
      { id: "r04-3", name: "Meskel Square", time: "08:18 AM", coords: { x: 58, y: 50 }, passengersWaiting: 22, status: "upcoming"  },
      { id: "r04-4", name: "Stadium",       time: "08:26 AM", coords: { x: 88, y: 40 }, passengersWaiting: 9,  status: "upcoming"  },
    ],
  },
  "Route 18": {
    routeId: "Route 18 Express",
    busId: "SBTS-BUS-073",
    originLabel: "CMC",
    destLabel: "Mexico",
    stops: [
      { id: "r18-1", name: "CMC",       time: "09:00 AM", coords: { x: 8,  y: 38 }, passengersWaiting: 7,  status: "completed" },
      { id: "r18-2", name: "Ayat",      time: "09:10 AM", coords: { x: 28, y: 50 }, passengersWaiting: 14, status: "current"   },
      { id: "r18-3", name: "Piassa",    time: "09:22 AM", coords: { x: 55, y: 40 }, passengersWaiting: 20, status: "upcoming"  },
      { id: "r18-4", name: "Mexico",    time: "09:32 AM", coords: { x: 88, y: 45 }, passengersWaiting: 5,  status: "upcoming"  },
    ],
  },
};

export const LiveMapView: React.FC<{ routeName?: string }> = ({ routeName }) => {
  const location = useLocation();
  const [dynamicSelectedRoute, setDynamicSelectedRoute] = useState<any>(location.state?.selectedRoute || null);
  const [dynamicOrigin, setDynamicOrigin] = useState<string>(location.state?.origin || "");
  const [dynamicDestination, setDynamicDestination] = useState<string>(location.state?.destination || "");
  const [dynamicViaStops, setDynamicViaStops] = useState<string[]>(location.state?.viaStops || []);

  const selectedRoute = dynamicSelectedRoute || location.state?.selectedRoute;
  const destinationStr: string = dynamicDestination || location.state?.destination || "";
  const originStr: string = dynamicOrigin || location.state?.origin || "";
  const viaStops: string[] = dynamicViaStops.length > 0 ? dynamicViaStops : (location.state?.viaStops || []);

  // Listen for real-time route selection from the side panel ("Plan a Trip" or "Find Bus Stop")
  useEffect(() => {
    const handleSelectRouteEvent = (e: any) => {
      const route = e.detail?.selectedRoute;

      if (!route) {
        setDynamicSelectedRoute(null);
        setDynamicOrigin("");
        setDynamicDestination("");
        setDynamicViaStops([]);
        setBusProgress(0);
        setIsTripCompleted(false);
        return;
      }

      setDynamicSelectedRoute(route);
      setDynamicOrigin(e.detail.origin || "");
      setDynamicDestination(e.detail.destination || "");
      setDynamicViaStops(e.detail.viaStops || []);
      setBusProgress(8);
      setIsTripCompleted(false);
    };
    window.addEventListener("sbts:select_route", handleSelectRouteEvent);
    return () => window.removeEventListener("sbts:select_route", handleSelectRouteEvent);
  }, []);

  const activePreset = (routeName && ROUTE_PRESETS[routeName]) ? ROUTE_PRESETS[routeName] : null;
  const hasActiveRoute = Boolean(selectedRoute || activePreset);

  // Build display stops (Empty when no route is planned or selected)
  const { displayStops, displayRouteId, displayBusId, originLabel, destLabel } = useMemo(() => {
    if (!hasActiveRoute) {
      return {
        displayStops: [],
        displayRouteId: "",
        displayBusId: "",
        originLabel: "",
        destLabel: "",
      };
    }

    if (!selectedRoute && activePreset) {
      return {
        displayStops: activePreset.stops,
        displayRouteId: activePreset.routeId,
        displayBusId: activePreset.busId,
        originLabel: activePreset.originLabel,
        destLabel: activePreset.destLabel,
      };
    }

    const stops: Stop[] = [];
    const routeId = selectedRoute.busNumber || "Route 101 Express";
    const busId = "SBTS-BUS-" + (selectedRoute.id?.slice(0, 3).toUpperCase() || "114");

    const originName = originStr || selectedRoute.nearestStation?.name || "Origin";
    stops.push({
      id: "stop-start",
      name: originName,
      time: "Now",
      coords: { x: 8, y: 50 },
      passengersWaiting: selectedRoute.nearestStation?.walkTimeMinutes ?? 0,
      status: "completed",
    });

    if (selectedRoute.isMergedRoute && selectedRoute.legs && selectedRoute.legs.length > 0) {
      const totalLegs = selectedRoute.legs.length;
      const xStep = 80 / (totalLegs + 1);
      selectedRoute.legs.forEach((leg: any, idx: number) => {
        const xPos = 8 + xStep * (idx + 1);
        const yOffset = idx % 2 === 0 ? -12 : 12;
        stops.push({
          id: `stop-leg-${idx}`,
          name: idx < totalLegs - 1 ? leg.toStation : destinationStr,
          time: `+${leg.durationMinutes}m`,
          coords: { x: xPos, y: 50 + yOffset },
          passengersWaiting: 5,
          status: idx === 0 ? "current" : "upcoming",
        });
      });
    } else {
      const intermediates = viaStops.filter(
        (s) => s.toLowerCase() !== originName.toLowerCase() && s.toLowerCase() !== destinationStr.toLowerCase()
      );

      if (intermediates.length > 0) {
        const xStep = 82 / (intermediates.length + 1);
        intermediates.forEach((stopName, idx) => {
          const xPos = 8 + xStep * (idx + 1);
          const yOffset = idx % 2 === 0 ? -10 : 10;
          stops.push({
            id: `stop-via-${idx}`,
            name: stopName,
            time: `+${Math.round((selectedRoute.totalTripMinutes / (intermediates.length + 1)) * (idx + 1))}m`,
            coords: { x: xPos, y: 50 + yOffset },
            passengersWaiting: 5,
            status: "upcoming",
          });
        });
      }

      stops.push({
        id: "stop-dest",
        name: destinationStr,
        time: `~${selectedRoute.totalTripMinutes}m`,
        coords: { x: 90, y: 50 },
        passengersWaiting: 0,
        status: "upcoming",
      });
    }

    return {
      displayStops: stops,
      displayRouteId: routeId,
      displayBusId: busId,
      originLabel: stops[0]?.name || originStr,
      destLabel: stops[stops.length - 1]?.name || destinationStr,
    };
  }, [routeName, selectedRoute, originStr, destinationStr, viaStops, hasActiveRoute, activePreset]);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [busProgress, setBusProgress] = useState(selectedRoute ? 8 : 0);
  const [proximityAlertsEnabled, setProximityAlertsEnabled] = useState(true);
  const [activeProximityAlert, setActiveProximityAlert] = useState<ProximityAlert | null>(null);
  const [isMobileSheetExpanded, setIsMobileSheetExpanded] = useState(false);
  
  // Trip Completion State (No restart countdown or option)
  const [isTripCompleted, setIsTripCompleted] = useState<boolean>(false);

  // Dynamic Route AI Prediction State (Only active when a trip is planned or tracked)
  const [routeAiPrediction, setRouteAiPrediction] = useState<{
    traffic_level: string;
    traffic_confidence: number;
    estimated_duration_minutes: number;
    estimated_arrival: string;
    processing_time_ms: number;
    delay_risk: string;
    crowd_forecast: string;
    recommended_speed_kmh: number;
  } | null>(null);
  const [routeAiLoading, setRouteAiLoading] = useState(false);

  // Fetch live AI prediction only when a route is actively planned / selected
  const fetchRoutePrediction = useCallback(async () => {
    if (!hasActiveRoute || !originLabel || !destLabel) {
      setRouteAiPrediction(null);
      setRouteAiLoading(false);
      return;
    }

    setRouteAiLoading(true);
    try {
      const stopCoords: Record<string, { lat: number; lon: number }> = {
        "megenagna":     { lat: 9.0215, lon: 38.7989 },
        "ayat":          { lat: 9.0345, lon: 38.8650 },
        "cmc":           { lat: 9.0265, lon: 38.8310 },
        "mexico":        { lat: 9.0105, lon: 38.7425 },
        "stadium":       { lat: 9.0135, lon: 38.7562 },
        "atlas":         { lat: 9.0025, lon: 38.7735 },
        "medhanealem":   { lat: 8.9950, lon: 38.7865 },
        "airport":       { lat: 8.9805, lon: 38.7995 },
        "kality":        { lat: 8.9250, lon: 38.7520 },
        "akaki":         { lat: 8.8785, lon: 38.7842 },
        "tor hailoch":   { lat: 9.0125, lon: 38.7230 },
        "sarbet":        { lat: 8.9985, lon: 38.7345 },
        "piazza":        { lat: 9.0355, lon: 38.7515 },
        "piassa":        { lat: 9.0355, lon: 38.7515 },
      };

      const oKey = originLabel.toLowerCase();
      const dKey = destLabel.toLowerCase();

      const matchO = Object.keys(stopCoords).find(k => oKey.includes(k));
      const matchD = Object.keys(stopCoords).find(k => dKey.includes(k));

      const originC = matchO ? stopCoords[matchO] : { lat: 9.0215, lon: 38.7989 };
      const destC = matchD ? stopCoords[matchD] : { lat: 8.9805, lon: 38.7995 };

      const res = await aiIntegrationApi.predictCombined({
        origin_lat: originC.lat,
        origin_lon: originC.lon,
        dest_lat: destC.lat,
        dest_lon: destC.lon,
        direction: "Forward",
        timestamp: new Date().toISOString(),
      });
      const raw = res.data?.data || res.data;
      if (raw) {
        const trafficLevel = String(raw.traffic_level || "Medium");
        const confidence = typeof raw.traffic_confidence === "number" ? raw.traffic_confidence : 0.94;
        const duration = typeof raw.estimated_duration_minutes === "number" ? raw.estimated_duration_minutes : 22;
        const arrivalDate = new Date(Date.now() + duration * 60000);
        const arrivalStr = arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setRouteAiPrediction({
          traffic_level: trafficLevel === "High" ? "Heavy Traffic" : trafficLevel === "Medium" ? "Moderate Congestion" : "Light Traffic",
          traffic_confidence: confidence,
          estimated_duration_minutes: duration,
          estimated_arrival: arrivalStr,
          processing_time_ms: typeof raw.processing_time_ms === "number" ? raw.processing_time_ms : 1.8,
          delay_risk: trafficLevel === "High" ? "Moderate Delay (+4m)" : "Minimal Delay Risk (+0m)",
          crowd_forecast: trafficLevel === "High" ? "High Passenger Volume" : "Comfortable Seating Available",
          recommended_speed_kmh: trafficLevel === "High" ? 28 : trafficLevel === "Medium" ? 42 : 52,
        });
      }
    } catch (err) {
      console.warn("Could not fetch route AI prediction:", err);
      const arrivalDate = new Date(Date.now() + 22 * 60000);
      setRouteAiPrediction({
        traffic_level: "Moderate Congestion",
        traffic_confidence: 0.92,
        estimated_duration_minutes: 22,
        estimated_arrival: arrivalDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        processing_time_ms: 1.8,
        delay_risk: "Minimal Delay Risk (+0m)",
        crowd_forecast: "Comfortable Seating Available",
        recommended_speed_kmh: 42,
      });
    } finally {
      setRouteAiLoading(false);
    }
  }, [hasActiveRoute, originLabel, destLabel]);

  useEffect(() => {
    if (hasActiveRoute) {
      fetchRoutePrediction();
    } else {
      setRouteAiPrediction(null);
    }
  }, [fetchRoutePrediction, hasActiveRoute]);

  // Reset bus to start whenever a new route is selected
  useEffect(() => {
    if (selectedRoute) {
      setBusProgress(8);
      setIsTripCompleted(false);
    }
  }, [selectedRoute]);

  useEffect(() => {
    if (location.hash === '#live-route-map') {
      const el = document.getElementById('live-route-map');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [location.hash]);

  // Backend tracking state
  const [liveBusLocations, setLiveBusLocations] = useState<BusTrackingLocation[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [isWebSocketActive, setIsWebSocketActive] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const fetchLiveTracking = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await trackingApi.getAllBusLocations();
      if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
        setLiveBusLocations(res.data.data);
        setIsLiveConnected(true);
      } else {
        setIsLiveConnected(false);
      }
    } catch (err) {
      console.warn("Could not reach /tracking API, falling back to live simulation mode:", err);
      setIsLiveConnected(false);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveTracking();

    const unsubscribeSocket = subscribeToAllTracking((update: BusLocationUpdate) => {
      if (update && update.busId && update.location) {
        setIsWebSocketActive(true);
        setIsLiveConnected(true);
        setLiveBusLocations((prev) => {
          const index = prev.findIndex((b) => b.busId === update.busId);
          const updatedItem: BusTrackingLocation = {
            id: update.busId,
            busId: update.busId,
            latitude: update.location.latitude,
            longitude: update.location.longitude,
            speed: update.location.speed ?? 40,
            heading: update.location.heading,
            timestamp: update.timestamp,
          };
          if (index >= 0) {
            const next = [...prev];
            next[index] = updatedItem;
            return next;
          }
          return [updatedItem, ...prev];
        });
      }
    });

    const interval = setInterval(fetchLiveTracking, 10000);
    return () => {
      unsubscribeSocket();
      clearInterval(interval);
    };
  }, [fetchLiveTracking]);

  // Continuous movement loop until arrival (only runs when hasActiveRoute is true and trip is not completed)
  useEffect(() => {
    if (!hasActiveRoute || isTripCompleted) return;

    const interval = setInterval(() => {
      setBusProgress((prev) => {
        if (prev >= 98) {
          setIsTripCompleted(true);
          return 100;
        }
        return prev + 0.45;
      });
    }, 250);

    return () => clearInterval(interval);
  }, [isTripCompleted, hasActiveRoute]);

  const activeLiveBus = liveBusLocations[0];
  const currentSpeed = isTripCompleted ? 0 : (activeLiveBus?.speed ?? Math.round(36 + Math.sin(busProgress / 5) * 8));

  // Proximity Alert Detection Loop
  useEffect(() => {
    if (!proximityAlertsEnabled || isTripCompleted || !hasActiveRoute) return;
    const alert = evaluateStopProximity(
      busProgress,
      displayStops,
      activeLiveBus ? activeLiveBus.busId : displayBusId,
      displayRouteId
    );
    if (alert) {
      setActiveProximityAlert(alert);
      const timer = setTimeout(() => {
        setActiveProximityAlert((curr) => (curr?.id === alert.id ? null : curr));
      }, 7000);
      return () => clearTimeout(timer);
    }
  }, [busProgress, displayStops, activeLiveBus, displayBusId, displayRouteId, proximityAlertsEnabled, isTripCompleted, hasActiveRoute]);

  // Broadcast active route state to Left Sidebar and Mobile Bottom Sheet
  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("sbts:active_route_state", {
        detail: {
          hasActiveRoute,
          displayRouteId,
          displayBusId,
          originLabel,
          destLabel,
          busProgress,
          currentSpeed,
          isTripCompleted,
          displayStops,
          routeAiPrediction,
          routeAiLoading,
          isWebSocketActive,
        },
      })
    );
  }, [
    hasActiveRoute,
    displayRouteId,
    displayBusId,
    originLabel,
    destLabel,
    busProgress,
    currentSpeed,
    isTripCompleted,
    displayStops,
    routeAiPrediction,
    routeAiLoading,
    isWebSocketActive,
  ]);

  return (
    <div className={`relative flex h-full w-full min-h-0 min-w-0 overflow-hidden bg-slate-200 ${
      isFullscreen ? "fixed inset-0 z-50 bg-slate-100" : ""
    }`}>
      <div className="relative z-10 h-full w-full min-h-0 flex-1 overflow-hidden select-none">
        <div className="absolute inset-x-0 bottom-0 z-[30] hidden px-3 pb-3 sm:block sm:px-4 sm:pb-4">
          {hasActiveRoute ? (
            <div className="mx-auto max-w-md rounded-[28px] border border-slate-200/80 bg-white/90 p-3.5 shadow-[0_18px_50px_-16px_rgba(15,23,42,0.32)] backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#2B4B9E] px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                      {displayBusId || "SBTS-BUS-114"}
                    </span>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
                      {isTripCompleted ? "Arrived" : "On route"}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-black tracking-tight text-slate-900">{displayRouteId}</h3>
                  <p className="mt-1 text-xs font-semibold text-slate-600">{originLabel} → {destLabel}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black leading-none text-[#2B4B9E]">{Math.max(1, Math.round((100 - busProgress) / 5))}m</p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">ETA</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Next stop</p>
                  <p className="text-sm font-black text-slate-900">{displayStops[displayStops.length - 1]?.name || destLabel}</p>
                </div>
                <div className="rounded-xl bg-emerald-100 px-2.5 py-1.5 text-right">
                  <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-700">Status</p>
                  <p className="text-xs font-black text-emerald-700">{isTripCompleted ? "Done" : "Moving"}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-sm rounded-[26px] border border-slate-200/80 bg-white/85 px-4 py-3 text-center shadow-[0_18px_50px_-16px_rgba(15,23,42,0.25)] backdrop-blur-sm">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Transit</p>
              <p className="mt-1 text-base font-black text-slate-900">Ready when you are</p>
            </div>
          )}
        </div>

        <RealGoogleMap
          stops={displayStops}
          busProgress={busProgress}
          activeLiveBus={activeLiveBus}
          displayBusId={displayBusId}
          displayRouteId={displayRouteId}
          hasActiveRoute={hasActiveRoute}
          isSimulating={hasActiveRoute && !isTripCompleted}
          currentSpeed={currentSpeed}
          isTripCompleted={isTripCompleted}
        />
      </div>
    </div>
  );
};

export default LiveMapView;