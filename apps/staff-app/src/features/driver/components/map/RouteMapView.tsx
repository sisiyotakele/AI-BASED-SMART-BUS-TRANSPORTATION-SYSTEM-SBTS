// src/features/driver/components/map/RouteMapView.tsx

import React, { useEffect, useState, useRef, useMemo, memo, Suspense } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLng, MAP_TILES, MapType, BUS_ID } from '../../constants/map';
import { getRouteFromOSRM } from '../../constants/map';
import { RouteLine } from './RouteLine';
import { StopMarkers } from './StopMarkers';
import { MapControls } from './MapControls';

// ─── Fix: Leaflet default icon issue ─────────────────────────────
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ─── Bus Icon with direction ──────────────────────────────────────
const createBusIcon = (heading: number = 0) => {
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:44px;height:44px;cursor:pointer;transform:rotate(${heading}deg);">
        <div style="position:absolute;inset:-6px;border-radius:9999px;background:radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%);animation:pulse-ring 2s infinite;"></div>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          <rect x="4" y="10" width="36" height="20" rx="3.5" fill="#12B2E4"/>
          <rect x="4" y="10" width="36" height="20" rx="3.5" stroke="white" stroke-width="1.5"/>
          <rect x="4" y="10" width="36" height="3.5" rx="1" fill="#3b82f6" opacity="0.6"/>
          <rect x="7" y="13.5" width="7" height="4.5" rx="1" fill="rgba(255,255,255,0.4)"/>
          <rect x="16" y="13.5" width="7" height="4.5" rx="1" fill="rgba(255,255,255,0.4)"/>
          <rect x="25" y="13.5" width="7" height="4.5" rx="1" fill="rgba(255,255,255,0.4)"/>
          <circle cx="8" cy="26" r="2.5" fill="#fcd34d"/>
          <circle cx="36" cy="26" r="2.5" fill="#fcd34d"/>
          <circle cx="12" cy="32" r="4" fill="#1f2937"/>
          <circle cx="32" cy="32" r="4" fill="#1f2937"/>
          <circle cx="38" cy="8" r="4" fill="#10b981" stroke="white" stroke-width="1.2"/>
          <circle cx="38" cy="8" r="5.5" fill="#10b981" opacity="0.2"/>
          <text x="22" y="22" font-family="Inter" font-size="7" font-weight="800" fill="white" text-anchor="middle">102</text>
        </svg>
        <style>@keyframes pulse-ring{0%,100%{transform:scale(1);opacity:0.8;}50%{transform:scale(1.2);opacity:0.3;}}</style>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  });
};

// ─── Follow Bus ───────────────────────────────────────────────────
function FollowBus({ position, following }: { position: LatLng; following: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (following) {
      map.setView(position, map.getZoom(), { animate: true });
    }
  }, [position, following, map]);
  return null;
}

// ─── Map Events ───────────────────────────────────────────────────
function MapEvents({ onMove }: { onMove: () => void }) {
  useMapEvents({ 
    dragstart: onMove, 
    zoomstart: onMove 
  });
  return null;
}

// ─── Main Component ──────────────────────────────────────────────
interface RouteMapViewProps {
  position: LatLng;
  stops: LatLng[];
  stopNames: string[];
  currentStop: number;
  progress: number;
  following: boolean;
  mapType: MapType;
  onMapTypeChange: (type: MapType) => void;
  onFollowToggle: () => void;
  onUserMove: () => void;
  speed: number;
  showLegend?: boolean;
}

export const RouteMapView: React.FC<RouteMapViewProps> = ({
  position,
  stops,
  stopNames,
  currentStop,
  progress,
  following,
  mapType,
  onUserMove,
  onFollowToggle,
  speed,
  showLegend = false,
}) => {
  const [routePath, setRoutePath] = useState<LatLng[]>(stops);
  const [isLoadingRoute, setIsLoadingRoute] = useState(false);
  const [busHeading, setBusHeading] = useState(0);
  const prevPositionRef = useRef<LatLng | null>(null);
  const mapRef = useRef<any>(null);

  // ─── Fetch actual road route (optimized) ──────────────────────
  useEffect(() => {
    const fetchRoute = async () => {
      if (!stops || stops.length < 2) {
        setRoutePath(stops);
        return;
      }
      
      setIsLoadingRoute(true);
      try {
        const routed = await getRouteFromOSRM(stops);
        setRoutePath(routed);
      } catch {
        setRoutePath(stops);
      } finally {
        setIsLoadingRoute(false);
      }
    };
    fetchRoute();
  }, [stops]);

  // ─── Calculate bus heading based on movement ──────────────────
  useEffect(() => {
    if (prevPositionRef.current) {
      const [prevLat, prevLng] = prevPositionRef.current;
      const [currLat, currLng] = position;
      
      if (prevLat !== currLat || prevLng !== currLng) {
        const angle = Math.atan2(currLng - prevLng, currLat - prevLat);
        const degrees = (angle * 180) / Math.PI;
        setBusHeading(degrees);
      }
    }
    prevPositionRef.current = position;
  }, [position]);

  // ─── Find closest point on route for bus position ──────────────
  const getClosestPointOnRoute = useMemo(() => {
    return (pos: LatLng, route: LatLng[]): LatLng => {
      if (!route || route.length === 0) return pos;
      
      let closest = route[0];
      let minDist = Infinity;
      
      for (const point of route) {
        const dist = Math.sqrt(
          Math.pow(point[0] - pos[0], 2) + 
          Math.pow(point[1] - pos[1], 2)
        );
        if (dist < minDist) {
          minDist = dist;
          closest = point;
        }
      }
      return closest;
    };
  }, []);

  const busPosition = routePath && routePath.length > 0 
    ? getClosestPointOnRoute(position, routePath) 
    : position;

  // ─── Memoize the bus icon ──────────────────────────────────────
  const busIcon = useMemo(() => createBusIcon(busHeading), [busHeading]);

  // ─── Map center (memoized) ─────────────────────────────────────
  const mapCenter = useMemo(() => position, [position]);

  // ─── Check if stops exist ──────────────────────────────────────
  if (!stops || stops.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">No route data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <MapContainer
        center={mapCenter}
        zoom={15}
        className="h-full w-full"
        zoomControl={false}
        attributionControl={false}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
      >
        <FollowBus position={busPosition} following={following} />
        <MapEvents onMove={onUserMove} />

        <TileLayer
          url={MAP_TILES[mapType]?.url || MAP_TILES.street.url}
          attribution={MAP_TILES[mapType]?.attribution || MAP_TILES.street.attribution}
        />

        <RouteLine stops={routePath} progress={progress} />

        {/* Bus Marker - follows the road line */}
        <Marker position={busPosition} icon={busIcon}>
          <Popup>
            <div className="text-center">
              <strong className="text-[#12B2E4]">{BUS_ID}</strong>
              <br />
              <span className="text-sm">Speed: {speed} km/h</span>
              <br />
              <span className="text-sm">Next: {stopNames[currentStop + 1] || 'Completed'}</span>
            </div>
          </Popup>
        </Marker>

        <StopMarkers
          stops={stops}
          stopNames={stopNames}
          currentStop={currentStop}
        />

        <MapControls
          following={following}
          onRecenter={onFollowToggle}
        />
      </MapContainer>

      {/* ─── Loading Overlay ────────────────────────────────────── */}
      {isLoadingRoute && (
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-8 h-8 border-3 border-[#12B2E4] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Loading route...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteMapView;