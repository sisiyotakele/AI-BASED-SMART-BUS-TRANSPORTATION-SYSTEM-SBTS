import React, { useEffect, useRef, useState, useMemo } from "react";
import L from "leaflet";
import { 
  Radio, 
  Target, 
  Maximize, 
  Plus, 
  Minus, 
  Sparkles,
  Layers,
  Box,
  Bus as BusIcon
} from "lucide-react";
import { BusTrackingLocation } from "./LiveMapView";

export interface GeoStop {
  id: string;
  name: string;
  time: string;
  lat: number;
  lng: number;
  passengersWaiting: number;
  status: "completed" | "current" | "upcoming";
}

// Addis Ababa Real-World Stop Coordinates Mapping
export const ADDIS_ABABA_COORDS: Record<string, { lat: number; lng: number }> = {
  "megenagna":        { lat: 9.0215, lng: 38.7989 },
  "megenagna station":{ lat: 9.0215, lng: 38.7989 },
  "cmc":              { lat: 9.0265, lng: 38.8310 },
  "cmc michael":      { lat: 9.0265, lng: 38.8310 },
  "cmc roundabout":   { lat: 9.0265, lng: 38.8310 },
  "ayat":             { lat: 9.0345, lng: 38.8650 },
  "ayat station":     { lat: 9.0345, lng: 38.8650 },
  "bole medhanialem": { lat: 8.9950, lng: 38.7865 },
  "bole medhanealem": { lat: 8.9950, lng: 38.7865 },
  "bole atlas":       { lat: 9.0025, lng: 38.7735 },
  "atlas":            { lat: 9.0025, lng: 38.7735 },
  "bole airport":     { lat: 8.9805, lng: 38.7995 },
  "airport":          { lat: 8.9805, lng: 38.7995 },
  "tor hailoch":      { lat: 9.0125, lng: 38.7230 },
  "sarbet":           { lat: 8.9985, lng: 38.7345 },
  "meskel square":    { lat: 9.0105, lng: 38.7615 },
  "stadium":          { lat: 9.0135, lng: 38.7562 },
  "mexico":           { lat: 9.0105, lng: 38.7425 },
  "mexico square":    { lat: 9.0105, lng: 38.7425 },
  "piassa":           { lat: 9.0355, lng: 38.7515 },
  "piazza":           { lat: 9.0355, lng: 38.7515 },
  "akaki":            { lat: 8.8785, lng: 38.7842 },
  "akaki terminal":   { lat: 8.8785, lng: 38.7842 },
  "kality":           { lat: 8.9250, lng: 38.7520 },
  "kality station":   { lat: 8.9250, lng: 38.7520 },
  "mekanisa":         { lat: 8.9520, lng: 38.7000 },
  "lideta":           { lat: 9.0130, lng: 38.7380 },
  "kazanchis":        { lat: 9.0180, lng: 38.7680 },
  "legehar":          { lat: 9.0120, lng: 38.7530 },
  "gerji":            { lat: 8.9970, lng: 38.8050 },
  "gotera":           { lat: 8.9890, lng: 38.7550 },
};

// Google Maps Layer Tile Configurations
export type GoogleMapLayerType = "roadmap" | "satellite" | "hybrid" | "traffic";

const GOOGLE_TILE_LAYERS: Record<GoogleMapLayerType, { url: string; subdomains: string[]; maxZoom: number; label: string }> = {
  roadmap: {
    url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    maxZoom: 20,
    label: "Google Streets"
  },
  satellite: {
    url: "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    maxZoom: 20,
    label: "Google Satellite"
  },
  hybrid: {
    url: "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    maxZoom: 20,
    label: "Google Hybrid"
  },
  traffic: {
    url: "https://{s}.google.com/vt/lyrs=m,traffic&x={x}&y={y}&z={z}",
    subdomains: ["mt0", "mt1", "mt2", "mt3"],
    maxZoom: 20,
    label: "Live Traffic"
  },
};

export interface RealGoogleMapProps {
  stops: Array<{
    id: string;
    name: string;
    time: string;
    passengersWaiting: number;
    status: "completed" | "current" | "upcoming";
  }>;
  busProgress: number; // 0 to 100
  activeLiveBus?: BusTrackingLocation;
  displayBusId: string;
  displayRouteId: string;
  hasActiveRoute: boolean;
  isSimulating: boolean;
  currentSpeed: number;
  isTripCompleted?: boolean;
  onRestartTrip?: () => void;
}

export const RealGoogleMap: React.FC<RealGoogleMapProps> = ({
  stops,
  busProgress,
  activeLiveBus,
  displayBusId,
  displayRouteId,
  hasActiveRoute,
  isSimulating,
  currentSpeed,
  isTripCompleted = false,
  onRestartTrip,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const routeGlowRef = useRef<L.Polyline | null>(null);
  const traversedPolylineRef = useRef<L.Polyline | null>(null);
  const stopMarkersRef = useRef<L.Marker[]>([]);
  const busMarkerRef = useRef<L.Marker | null>(null);
  const carMarkerRef = useRef<L.Marker | null>(null);

  const [activeLayer, setActiveLayer] = useState<GoogleMapLayerType>("roadmap");
  const [autoCenterBus, setAutoCenterBus] = useState<boolean>(true);
  const [focusedVehicle, setFocusedVehicle] = useState<"bus" | "car">("bus");
  const [isLayerMenuOpen, setIsLayerMenuOpen] = useState<boolean>(false);
  const [is3DView, setIs3DView] = useState<boolean>(false);

  const selectLayer = (layer: GoogleMapLayerType) => {
    setActiveLayer(layer);
    setIs3DView(false);
  };

  // Helper to lookup coordinates from stop name or fallback around central Addis Ababa
  const resolveCoordinates = (name: string, index: number, total: number): { lat: number; lng: number } => {
    const key = name.toLowerCase().trim();
    for (const [k, coords] of Object.entries(ADDIS_ABABA_COORDS)) {
      if (key.includes(k) || k.includes(key)) {
        return coords;
      }
    }
    // Interpolated spread across Addis Ababa
    const baseLat = 9.0105;
    const baseLng = 38.7425;
    const spread = (index / Math.max(1, total - 1)) * 0.08;
    return {
      lat: baseLat + spread * 0.3,
      lng: baseLng + spread,
    };
  };

  // Resolved stops with exact GPS
  const resolvedStops: GeoStop[] = useMemo(() => {
    if (!stops || stops.length === 0) return [];
    return stops.map((s, idx) => {
      const explicitLat = typeof (s as any).lat === "number" ? (s as any).lat : (s as any).latitude;
      const explicitLng = typeof (s as any).lng === "number" ? (s as any).lng : (s as any).longitude;
      const coords = (typeof explicitLat === "number" && typeof explicitLng === "number")
        ? { lat: explicitLat, lng: explicitLng }
        : resolveCoordinates(s.name, idx, stops.length);
      return {
        ...s,
        lat: coords.lat,
        lng: coords.lng,
      };
    });
  }, [stops]);

  // ── OSRM Real-Road Route Geometry ──────────────────────────────────────────
  // Fetches actual road-following coordinates from the free OSRM routing API.
  // Falls back to straight segments if the API is unreachable.
  const [roadCoords, setRoadCoords] = useState<[number, number][]>([]);

  useEffect(() => {
    if (resolvedStops.length < 2) {
      setRoadCoords(resolvedStops.map((s) => [s.lat, s.lng]));
      return;
    }

    let cancelled = false;

    const fetchRoadRoute = async () => {
      try {
        // Build OSRM coordinate string: lon,lat;lon,lat;...
        const coordStr = resolvedStops
          .map((s) => `${s.lng},${s.lat}`)
          .join(";");

        const url =
          `https://router.project-osrm.org/route/v1/driving/${coordStr}` +
          `?overview=full&geometries=geojson&steps=false`;

        const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
        if (!res.ok) throw new Error("OSRM fetch failed");

        const data = await res.json();
        if (
          data.code === "Ok" &&
          data.routes?.[0]?.geometry?.coordinates
        ) {
          // GeoJSON coords are [lng, lat] — flip to Leaflet [lat, lng]
          const pts: [number, number][] = data.routes[0].geometry.coordinates.map(
            ([lng, lat]: [number, number]) => [lat, lng] as [number, number]
          );
          if (!cancelled) setRoadCoords(pts);
        } else {
          throw new Error("No route in OSRM response");
        }
      } catch {
        // Fallback: straight segments between stops
        if (!cancelled) {
          setRoadCoords(resolvedStops.map((s) => [s.lat, s.lng]));
        }
      }
    };

    fetchRoadRoute();
    return () => { cancelled = true; };
  }, [resolvedStops]);

  // Compute position along route helper
  const computePositionAlongRoute = (progressPercent: number): { lat: number; lng: number; heading: number } => {
    if (resolvedStops.length === 0) {
      return { lat: 9.0105, lng: 38.7615, heading: 45 };
    }
    if (resolvedStops.length === 1) {
      return { lat: resolvedStops[0].lat, lng: resolvedStops[0].lng, heading: 0 };
    }

    const totalSegments = resolvedStops.length - 1;
    const clampedProgress = Math.max(0, Math.min(100, progressPercent));
    const segmentProgress = (clampedProgress / 100) * totalSegments;
    const currentSegmentIndex = Math.min(Math.floor(segmentProgress), totalSegments - 1);
    const fraction = segmentProgress - currentSegmentIndex;

    const p1 = resolvedStops[currentSegmentIndex];
    const p2 = resolvedStops[currentSegmentIndex + 1];

    const lat = p1.lat + (p2.lat - p1.lat) * fraction;
    const lng = p1.lng + (p2.lng - p1.lng) * fraction;

    const dLat = p2.lat - p1.lat;
    const dLng = p2.lng - p1.lng;
    const headingRad = Math.atan2(dLng, dLat);
    const headingDeg = (headingRad * 180) / Math.PI;

    return {
      lat,
      lng,
      heading: (headingDeg + 360) % 360,
    };
  };

  const computeRoadHeading = (progressPercent: number): number | null => {
    if (roadCoords.length < 2) return null;

    const progress = Math.max(0, Math.min(100, progressPercent)) / 100;
    const pointIndex = Math.min(
      Math.max(1, Math.round(progress * (roadCoords.length - 1))),
      roadCoords.length - 1
    );
    const previousPoint = roadCoords[pointIndex - 1];
    const currentPoint = roadCoords[pointIndex];
    const deltaLat = currentPoint[0] - previousPoint[0];
    const deltaLng = currentPoint[1] - previousPoint[1];

    if (deltaLat === 0 && deltaLng === 0) return null;
    return (Math.atan2(deltaLng, deltaLat) * 180 / Math.PI + 360) % 360;
  };

  const computePositionAlongRoad = (progressPercent: number): { lat: number; lng: number; heading: number } | null => {
    if (roadCoords.length < 2) return null;

    const progress = Math.max(0, Math.min(100, progressPercent)) / 100;
    const exactIndex = progress * (roadCoords.length - 1);
    const pointIndex = Math.min(Math.floor(exactIndex), roadCoords.length - 2);
    const fraction = exactIndex - pointIndex;
    const start = roadCoords[pointIndex];
    const end = roadCoords[pointIndex + 1];
    const heading = computeRoadHeading(progressPercent) ?? 0;

    return {
      lat: start[0] + (end[0] - start[0]) * fraction,
      lng: start[1] + (end[1] - start[1]) * fraction,
      heading,
    };
  };

  // Compute live Bus GPS Position
  const busPosition = useMemo((): { lat: number; lng: number; heading: number } => {
    const routePosition = computePositionAlongRoad(busProgress) ?? computePositionAlongRoute(busProgress);
    return {
      ...routePosition,
      heading: routePosition.heading,
    };
  }, [resolvedStops, roadCoords, busProgress]);

  // Compute live Car GPS Position (traveling dynamically along the corridor)
  const carProgress = (busProgress * 1.15) % 100;
  const carPosition = useMemo((): { lat: number; lng: number; heading: number } => {
    return computePositionAlongRoute(carProgress);
  }, [resolvedStops, carProgress]);

  // 1. Initialize Map Instance
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter: [number, number] = [9.0105, 38.7615]; // Meskel Square, Addis Ababa

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    // Add Google Map Tile Layer (Desaturated Silver/Retro transit styling for high contrast route overlay)
    const layerConfig = GOOGLE_TILE_LAYERS[activeLayer];
    const tileLayer = L.tileLayer(layerConfig.url, {
      subdomains: layerConfig.subdomains,
      maxZoom: layerConfig.maxZoom,
      attribution: "Google Maps",
      className: activeLayer === "roadmap" ? "leaflet-silver-theme" : undefined,
    }).addTo(map);

    tileLayerRef.current = tileLayer;
    mapInstanceRef.current = map;

    // ResizeObserver ensures Leaflet recalculates tiles whenever container size changes (e.g. sidebar collapse/expand)
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize();
    });
    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Immediate and delayed invalidateSize to guarantee full viewport tile coverage
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 100);
    const t2 = setTimeout(() => map.invalidateSize(), 350);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      resizeObserver.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Handle Layer Type Changes (Roadmap / Satellite / Hybrid / Traffic)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const layerConfig = GOOGLE_TILE_LAYERS[activeLayer];
    tileLayerRef.current?.remove();

    // Recreate the layer so Leaflet starts a fresh tile request for each mode.
    tileLayerRef.current = L.tileLayer(layerConfig.url, {
      subdomains: layerConfig.subdomains,
      maxZoom: layerConfig.maxZoom,
      attribution: "Google Maps",
      className: activeLayer === "roadmap" ? "leaflet-silver-theme" : undefined,
    }).addTo(map);

    map.invalidateSize({ animate: false });
  }, [activeLayer]);

  // 3. Render Route Polyline & Stops (uses real OSRM road geometry when available)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous stop markers
    stopMarkersRef.current.forEach((m) => m.remove());
    stopMarkersRef.current = [];

    // Clear previous polylines
    if (routePolylineRef.current) { routePolylineRef.current.remove(); routePolylineRef.current = null; }
    if (routeGlowRef.current)     { routeGlowRef.current.remove();     routeGlowRef.current = null;     }
    if (traversedPolylineRef.current) { traversedPolylineRef.current.remove(); traversedPolylineRef.current = null; }

    // Use real road coords if available, otherwise fall back to stop-to-stop
    const lineCoords: L.LatLngExpression[] =
      roadCoords.length >= 2
        ? roadCoords
        : resolvedStops.map((s) => [s.lat, s.lng]);

    if (lineCoords.length > 0) {
      // Outer glow — blue tint under the road line
      routeGlowRef.current = L.polyline(lineCoords, {
        color: "#3b82f6",
        weight: 9,
        opacity: 0.35,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      // Core road-following route line — high-contrast navy blue
      routePolylineRef.current = L.polyline(lineCoords, {
        color: "#1E3A8A",
        weight: 5.5,
        opacity: 0.95,
        lineCap: "round",
        lineJoin: "round",
      }).addTo(map);

      // Stop markers (high-contrast badges with crisp white outline and deep shadows)
      resolvedStops.forEach((stop, idx) => {
        const isNext = stop.status === "current";
        const isPassed = stop.status === "completed";

        const markerHtml = `
          <div class="relative flex items-center justify-center cursor-pointer group">
            <div class="w-7 h-7 rounded-full flex items-center justify-center shadow-xl text-xs font-black text-white border-[2.5px] border-white transition-transform duration-200 group-hover:scale-125 ${
              isNext
                ? 'bg-emerald-600 ring-4 ring-emerald-500/40 animate-pulse'
                : isPassed
                ? 'bg-slate-400'
                : 'bg-[#2B4B9E]'
            }">
              ${idx + 1}
            </div>
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white/90 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-sm border border-slate-200 whitespace-nowrap pointer-events-none">
              ${stop.name}
            </div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: "custom-stop-marker",
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([stop.lat, stop.lng], { icon: customIcon }).addTo(map);
        marker.bindPopup(`
          <div class="p-1 min-w-[140px] text-slate-800 font-sans">
            <div class="flex items-center gap-1 font-bold text-xs text-[#2B4B9E] border-b pb-1 mb-1">
              <span>🚏 ${stop.name}</span>
            </div>
            <div class="text-[11px] space-y-0.5">
              <div><strong>Status:</strong> ${isNext ? '🟢 Next Stop' : isPassed ? '✓ Passed' : 'Upcoming'}</div>
              <div><strong>ETA:</strong> ${stop.time}</div>
              <div><strong>Waiting:</strong> ${stop.passengersWaiting} passengers</div>
            </div>
          </div>
        `);
        stopMarkersRef.current.push(marker);
      });

      // Fit map to road bounds
      if (lineCoords.length > 1) {
        const bounds = L.latLngBounds(lineCoords as [number, number][]);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true });
      }
    } else {
      map.setView([9.0105, 38.7615], 13);
    }
  }, [resolvedStops, roadCoords]);

  // Helper to determine the next upcoming station along the route
  const nextStation = useMemo(() => {
    if (resolvedStops.length < 2) return null;
    const totalSegments = resolvedStops.length - 1;
    const clampedProgress = Math.max(0, Math.min(100, busProgress));
    const segmentProgress = (clampedProgress / 100) * totalSegments;
    const nextIdx = Math.min(Math.floor(segmentProgress) + 1, resolvedStops.length - 1);
    return resolvedStops[nextIdx];
  }, [resolvedStops, busProgress]);

  // 4. Update Live Bus Marker & Traversed Path on the drawn line
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (resolvedStops.length === 0 || !hasActiveRoute) {
      if (busMarkerRef.current) {
        busMarkerRef.current.remove();
        busMarkerRef.current = null;
      }
      if (traversedPolylineRef.current) {
        traversedPolylineRef.current.remove();
        traversedPolylineRef.current = null;
      }
      return;
    }

    const { lat, lng, heading } = busPosition;
    const isMoving = currentSpeed > 0 || isSimulating;
    const nextStopTitle = nextStation ? nextStation.name : (resolvedStops[resolvedStops.length - 1]?.name || 'Destination');

    // Draw / update Traversed Path — follows the real road geometry up to bus position
    {
      // Slice the road coords proportionally to busProgress
      const roadLine = roadCoords.length >= 2 ? roadCoords : resolvedStops.map((s) => [s.lat, s.lng] as [number, number]);
      const clampedProgress = Math.max(0, Math.min(100, busProgress)) / 100;
      const cutoffIdx = Math.round(clampedProgress * (roadLine.length - 1));
      const passedCoords: L.LatLngExpression[] = roadLine.slice(0, cutoffIdx + 1);
      if (passedCoords.length < 1) passedCoords.push([lat, lng]);

      if (traversedPolylineRef.current) {
        traversedPolylineRef.current.setLatLngs(passedCoords);
      } else {
        traversedPolylineRef.current = L.polyline(passedCoords, {
          color: "#10B981",
          weight: 6,
          opacity: 0.95,
          lineCap: "round",
          lineJoin: "round",
        }).addTo(map);
      }
    }

    const isComplete = isTripCompleted || busProgress >= 98;

    // Prominent Transit Bus Sign directly on the drawn line
    const busHtml = `
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;width:130px;height:78px;cursor:pointer;user-select:none;">
        <!-- Top Floating Destination & Bus ID Sign -->
        <div style="display:flex;align-items:center;gap:4px;${
          isComplete 
            ? 'background:#064E3B;color:#6EE7B7;border:1.5px solid #10B981;box-shadow:0 4px 14px rgba(16,185,129,0.45);' 
            : 'background:#0F172A;color:white;border:1.5px solid #22C55E;box-shadow:0 4px 12px rgba(0,0,0,0.45);'
        }font-size:9px;font-weight:900;padding:3px 8px;border-radius:999px;white-space:nowrap;z-index:30;">
          <span style="font-size:11px;">${isComplete ? '🏁' : '🚌'}</span>
          <span style="color:${isComplete ? '#A7F3D0' : '#60A5FA'};">${displayBusId || "SBTS-114"}</span>
          <span style="color:${isComplete ? '#34D399' : '#94A3B8'};">•</span>
          <span style="color:${isComplete ? '#FFFFFF' : '#4ADE80'};font-weight:900;">${isComplete ? 'TRIP COMPLETED' : 'LIVE BUS'}</span>
        </div>

        <!-- Center: 3D Transit Circular Badge with Direction Pointer -->
        <div style="position:relative;margin-top:2px;display:flex;align-items:center;justify-content:center;width:34px;height:34px;border-radius:50%;background:${
          isComplete ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' : 'linear-gradient(135deg, #1E40AF 0%, #3B82F6 100%)'
        };border:2.5px solid white;box-shadow:0 0 0 3px ${isComplete ? 'rgba(16,185,129,0.4)' : 'rgba(37,99,235,0.35)'}, 0 6px 14px rgba(0,0,0,0.35);z-index:25;">
          ${!isComplete ? `
            <!-- Rotating Direction Arrow on outer edge -->
            <div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;transform:rotate(${heading}deg);pointer-events:none;">
              <div style="position:absolute;top:-5px;color:#FBBF24;font-size:11px;font-weight:900;text-shadow:0 1px 3px rgba(0,0,0,0.6);">▲</div>
            </div>
          ` : ''}
          <!-- Center Glyph -->
          <span style="font-size:16px;line-height:1;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.4));">${isComplete ? '🎉' : '🚌'}</span>
        </div>

        <!-- Bottom Pin Pointer touching the drawn line directly -->
        <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:7px solid ${isComplete ? '#059669' : '#1E40AF'};margin-top:-1px;filter:drop-shadow(0 2px 2px rgba(0,0,0,0.3));z-index:20;"></div>
      </div>
    `;

    const busIcon = L.divIcon({
      html: busHtml,
      className: "",
      iconSize: [130, 78],
      iconAnchor: [65, 70],
    });

    if (!busMarkerRef.current) {
      const marker = L.marker([lat, lng], { icon: busIcon, zIndexOffset: 1000 }).addTo(map);
      marker.bindPopup(`
        <div class="p-1.5 min-w-[185px] text-slate-800 font-sans">
          <div class="flex items-center justify-between gap-1 font-black text-xs text-[#2B4B9E] border-b pb-1 mb-1">
            <span>🚌 ${displayBusId || 'SBTS Transit Bus'}</span>
            <span class="text-[9px] ${isComplete ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-800'} px-1.5 py-0.2 rounded-full font-black">
              ${isComplete ? '🎉 TRIP COMPLETED' : 'LIVE ON ROUTE'}
            </span>
          </div>
          <div class="text-[11px] space-y-0.5">
            <div><strong>${isComplete ? 'Terminus:' : 'Next Stop:'}</strong> ${nextStopTitle}</div>
            <div><strong>Route:</strong> ${displayRouteId}</div>
            <div><strong>Speed:</strong> ${isComplete ? '0 (Docked)' : `${currentSpeed} km/h`}</div>
            <div><strong>Status:</strong> ${isComplete ? '✓ Arrived at Final Station' : 'En Route'}</div>
            <div><strong>GPS:</strong> ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E</div>
          </div>
        </div>
      `);
      busMarkerRef.current = marker;
    } else {
      busMarkerRef.current.setLatLng([lat, lng]);
      busMarkerRef.current.setIcon(busIcon);
    }
  }, [busPosition, displayBusId, displayRouteId, currentSpeed, nextStation, isSimulating, busProgress, resolvedStops, isTripCompleted, roadCoords]);

  // Recenter on bus (one-time manual center on user request)
  const handleRecenterBus = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([busPosition.lat, busPosition.lng], 15, { animate: true });
    }
  };

  // Fit whole route
  const handleFitRoute = () => {
    setAutoCenterBus(false);
    if (mapInstanceRef.current && resolvedStops.length > 0) {
      const bounds = L.latLngBounds(resolvedStops.map((s) => [s.lat, s.lng]));
      mapInstanceRef.current.fitBounds(bounds, { padding: [40, 40], animate: true });
    } else if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([9.0105, 38.7615], 13, { animate: true });
    }
  };

  // Map Zoom Handlers
  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  return (
    <div className="relative w-full h-full min-h-0 bg-slate-100 overflow-hidden select-none">
      {/* Real Google Map Canvas */}
      <div ref={mapContainerRef} className={`w-full h-full z-0 ${is3DView ? "leaflet-3d-mode" : ""}`} />

      {/* ── TOP RIGHT: GOOGLE MAP LAYER SELECTOR ── */}
      <div className="absolute top-2.5 right-2.5 z-[300] flex flex-col items-end gap-1.5">
        {/* Desktop Strip */}
        <div className="hidden md:flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl shadow-lg border border-slate-200/90 text-xs font-bold">
          <button
            onClick={() => selectLayer("roadmap")}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              activeLayer === "roadmap"
                ? "bg-[#2B4B9E] text-white shadow-xs"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Map
          </button>
          <button
            onClick={() => selectLayer("satellite")}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              activeLayer === "satellite"
                ? "bg-[#2B4B9E] text-white shadow-xs"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Satellite
          </button>
          <button
            onClick={() => selectLayer("hybrid")}
            className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
              activeLayer === "hybrid"
                ? "bg-[#2B4B9E] text-white shadow-xs"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            Hybrid
          </button>
          <button
            onClick={() => selectLayer("traffic")}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
              activeLayer === "traffic"
                ? "bg-amber-600 text-white shadow-xs"
                : "text-slate-700 hover:bg-slate-100"
            }`}
            title="Google Live Traffic Overlay"
          >
            <Sparkles className="w-3 h-3" />
            <span>Traffic</span>
          </button>
          <button
            type="button"
            onClick={() => setIs3DView((prev) => !prev)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-all cursor-pointer ${
              is3DView ? "bg-[#2B4B9E] text-white shadow-xs" : "text-slate-700 hover:bg-slate-100"
            }`}
            title="Toggle 3D perspective"
          >
            <Box className="h-3 w-3" />
            <span>3D</span>
          </button>
        </div>

        {/* Mobile Circular Layer Toggle & Dropdown */}
        <div className="md:hidden relative">
          <button
            type="button"
            onClick={() => setIsLayerMenuOpen((prev) => !prev)}
            className={`p-2.5 rounded-2xl shadow-lg border transition-all cursor-pointer flex items-center justify-center ${
              isLayerMenuOpen || activeLayer !== "roadmap"
                ? "bg-[#2B4B9E] text-white border-blue-700 shadow-blue-500/20"
                : "bg-white/95 text-slate-700 hover:bg-white border-slate-200"
            }`}
            title="Map Layer"
          >
            <Layers className="w-4 h-4" />
          </button>

          {isLayerMenuOpen && (
            <div className="absolute right-0 top-12 z-50 bg-white/98 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-1.5 min-w-[145px] flex flex-col gap-1 text-xs font-bold animate-in fade-in zoom-in-95 duration-150">
              <button
                type="button"
                onClick={() => { selectLayer("roadmap"); setIsLayerMenuOpen(false); }}
                className={`px-2.5 py-2 rounded-xl text-left transition-all ${
                  activeLayer === "roadmap" ? "bg-[#2B4B9E] text-white" : "hover:bg-slate-100 text-slate-800"
                }`}
              >
                🗺️ Standard Map
              </button>
              <button
                type="button"
                onClick={() => { selectLayer("satellite"); setIsLayerMenuOpen(false); }}
                className={`px-2.5 py-2 rounded-xl text-left transition-all ${
                  activeLayer === "satellite" ? "bg-[#2B4B9E] text-white" : "hover:bg-slate-100 text-slate-800"
                }`}
              >
                🛰️ Satellite
              </button>
              <button
                type="button"
                onClick={() => { selectLayer("hybrid"); setIsLayerMenuOpen(false); }}
                className={`px-2.5 py-2 rounded-xl text-left transition-all ${
                  activeLayer === "hybrid" ? "bg-[#2B4B9E] text-white" : "hover:bg-slate-100 text-slate-800"
                }`}
              >
                🏙️ Hybrid
              </button>
              <button
                type="button"
                onClick={() => { selectLayer("traffic"); setIsLayerMenuOpen(false); }}
                className={`px-2.5 py-2 rounded-xl text-left transition-all flex items-center justify-between ${
                  activeLayer === "traffic" ? "bg-amber-600 text-white" : "hover:bg-slate-100 text-amber-700"
                }`}
              >
                <span>🚦 Live Traffic</span>
                <Sparkles className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={() => { setIs3DView((prev) => !prev); setIsLayerMenuOpen(false); }}
                className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all ${
                  is3DView ? "bg-[#2B4B9E] text-white" : "hover:bg-slate-100 text-slate-800"
                }`}
              >
                <span>3D Perspective</span>
                <Box className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM RIGHT: SMART GOOGLE MAP CONTROLS ── */}
      <div className="absolute bottom-20 md:bottom-3 right-3 z-[300] flex flex-col items-center gap-1.5">
        {/* Zoom Controls */}
        <div className="flex flex-col bg-white/95 rounded-xl shadow-lg border border-slate-200 overflow-hidden">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-slate-100 text-slate-700 border-b border-slate-100 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── BOTTOM LEFT: GOOGLE WATERMARK & LEGAL ATTRIBUTION ── */}
      <div className="absolute bottom-16 md:bottom-1.5 left-2 z-[300] pointer-events-none flex items-center gap-1 text-[10px] text-slate-600 bg-white/80 backdrop-blur-xs px-1.5 py-0.5 rounded shadow-2xs">
        <span className="font-bold">Google</span>
        <span className="text-slate-400">Map data ©2026</span>
      </div>
    </div>
  );
};

export default RealGoogleMap;
