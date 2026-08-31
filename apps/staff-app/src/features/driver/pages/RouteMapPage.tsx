// src/features/driver/pages/RouteMapPage.tsx

import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaCompass,
  FaArrowLeft,
  FaLocationArrow,
  FaSpinner,
} from 'react-icons/fa';
import { tripsApi } from '../services/api/trips';
import { MapType, TRAFFIC_STYLES, STOPS, STOP_NAMES } from '../constants/map';

// Lazy load the map component
const RouteMapView = lazy(() => import('../components/map/RouteMapView'));

interface TripState {
  position: [number, number];
  currentStop: number;
  nextStop: string;
  etaFormatted: string;
  remainingKm: number;
  progressPercentage: number;
  routeCoordinates?: [number, number][];
  routeStopNames?: string[];
}

type TrafficStatus = 'low' | 'moderate' | 'heavy';

const RouteMapPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // ─── State ──────────────────────────────────────────────────────
  const [trip, setTrip] = useState<TripState>({
    position: [9.03, 38.74],
    currentStop: 0,
    nextStop: 'Loading...',
    etaFormatted: '-- min',
    remainingKm: 0,
    progressPercentage: 0,
  });
  const [speed, setSpeed] = useState(0);
  const [trafficStatus, setTrafficStatus] = useState<TrafficStatus>('moderate');
  const [isFollowing, setIsFollowing] = useState(true);
  const [mapType, setMapType] = useState<MapType>("street");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);

  // ─── Refs for performance ──────────────────────────────────────
  const gpsWatchId = useRef<number | null>(null);
  const updateInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ─── Check if navigation was triggered from MyTripPage ────────
  const isNavigating = location.state?.startNavigation || false;

  // ─── Load Current Trip ─────────────────────────────────────────
  const loadCurrentTrip = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tripData = await tripsApi.getCurrentTrip();
      
      if (tripData) {
        const currentStopIndex = 0;
        const nextStopName = STOP_NAMES && STOP_NAMES.length > 1 
          ? STOP_NAMES[currentStopIndex + 1] 
          : 'Next Stop';
        
        setTrip({
          position: [9.03, 38.74],
          currentStop: currentStopIndex,
          nextStop: tripData.routeStopNames?.[currentStopIndex + 1] || nextStopName || 'Next Stop',
          etaFormatted: tripData.duration || '25 min',
          remainingKm: parseFloat(tripData.distance?.replace(' km', '') || '12.5'),
          progressPercentage: 0,
          routeCoordinates: tripData.routeCoordinates,
          routeStopNames: tripData.routeStopNames,
        });
        
        // Build route path from stops
        if (tripData.routeCoordinates && tripData.routeCoordinates.length > 0) {
          setRoutePath(tripData.routeCoordinates as [number, number][]);
        } else if (STOPS && STOPS.length > 0) {
          setRoutePath(STOPS as [number, number][]);
        }
      }
    } catch (err: any) {
      console.error('❌ Error loading current trip:', err);
      setError(err.message || 'Failed to load trip data');
    } finally {
      setLoading(false);
      setTimeout(() => setMapLoaded(true), 300);
    }
  }, []);

  // ─── Load on mount ─────────────────────────────────────────────
  useEffect(() => {
    loadCurrentTrip();
    
    return () => {
      if (gpsWatchId.current) {
        navigator.geolocation.clearWatch(gpsWatchId.current);
      }
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, [loadCurrentTrip]);

  // ─── Real-time GPS Update ─────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    
    gpsWatchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPosition: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        const newSpeed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : speed;
        
        let traffic: TrafficStatus = 'moderate';
        if (newSpeed > 40) traffic = 'low';
        else if (newSpeed > 20) traffic = 'moderate';
        else traffic = 'heavy';
        
        setTrip((prev) => ({
          ...prev,
          position: newPosition,
        }));
        setSpeed(newSpeed);
        setTrafficStatus(traffic);
        
        if (trip.remainingKm > 0 && newSpeed > 0) {
          const etaMinutes = Math.round((trip.remainingKm / newSpeed) * 60);
          const etaFormatted = etaMinutes > 60 
            ? `${Math.floor(etaMinutes / 60)}h ${etaMinutes % 60}m` 
            : `${etaMinutes} min`;
          setTrip((prev) => ({
            ...prev,
            etaFormatted: etaFormatted,
          }));
        }
      },
      (err) => {
        console.warn('GPS watch error:', err);
      },
      {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 10000,
      }
    );
    
    return () => {
      if (gpsWatchId.current) {
        navigator.geolocation.clearWatch(gpsWatchId.current);
      }
    };
  }, [trip.remainingKm, speed]);

  // ─── Simulate progress updates ────────────────────────────────
  useEffect(() => {
    if (updateInterval.current) {
      clearInterval(updateInterval.current);
    }
    
    updateInterval.current = setInterval(() => {
      setTrip((prev) => ({
        ...prev,
        progressPercentage: Math.min(prev.progressPercentage + 0.5, 100),
      }));
    }, 3000);
    
    return () => {
      if (updateInterval.current) {
        clearInterval(updateInterval.current);
      }
    };
  }, []);

  // ─── Get traffic style with fallback ──────────────────────────
  const getTrafficStyle = () => {
    const statusMap = {
      low: 'Normal',
      moderate: 'Moderate',
      heavy: 'Heavy',
    };
    
    const mappedKey = statusMap[trafficStatus] || 'Moderate';
    
    const defaultStyles = {
      Normal: { 
        text: 'text-emerald-600 dark:text-emerald-400', 
        chip: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', 
        dot: 'bg-emerald-500' 
      },
      Moderate: { 
        text: 'text-amber-600 dark:text-amber-400', 
        chip: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', 
        dot: 'bg-amber-500' 
      },
      Heavy: { 
        text: 'text-red-600 dark:text-red-400', 
        chip: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400', 
        dot: 'bg-red-500' 
      },
    };
    
    const styles = TRAFFIC_STYLES || defaultStyles;
    return styles[mappedKey as keyof typeof styles] || defaultStyles.Moderate;
  };

  const tStyle = getTrafficStyle();
  const progressPercentage = trip.progressPercentage;

  // ─── Get stops with fallback and proper typing ──────────────────
  const stops = (trip.routeCoordinates && trip.routeCoordinates.length > 0 ? trip.routeCoordinates : (STOPS && STOPS.length > 0 ? STOPS : [
    [9.03, 38.74],
    [9.04, 38.75],
    [9.05, 38.76],
  ])) as [number, number][];

  const stopNames = trip.routeStopNames && trip.routeStopNames.length > 0 ? trip.routeStopNames : (STOP_NAMES && STOP_NAMES.length > 0 ? STOP_NAMES : ['Stop 1', 'Stop 2', 'Stop 3']);

  // ─── Map type buttons ──────────────────────────────────────────
  const mapTypeButtons: Array<{ type: MapType; label: string; icon: string }> = [
    { type: 'street', label: 'Street', icon: '🗺️' },
    { type: 'satellite', label: 'Satellite', icon: '🛰️' },
    { type: 'terrain', label: 'Terrain', icon: '⛰️' },
    { type: 'dark', label: 'Dark', icon: '🌙' },
  ];

  // ─── Handlers ──────────────────────────────────────────────────
  const toggleFollowing = () => setIsFollowing(!isFollowing);

  const goBack = () => {
    navigate('/driver');
  };

  // ─── Loading State ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-[#12B2E4] text-4xl mx-auto" />
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading route data...</p>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      <div className="relative h-screen w-full">
        <Suspense fallback={
          <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="text-center">
              <FaSpinner className="animate-spin text-[#12B2E4] text-4xl mx-auto" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading map...</p>
            </div>
          </div>
        }>
          {mapLoaded ? (
            <RouteMapView
              position={trip.position}
              stops={stops}
              stopNames={stopNames}
              currentStop={trip.currentStop}
              progress={progressPercentage}
              following={isFollowing}
              mapType={mapType}
              onMapTypeChange={setMapType}
              onFollowToggle={toggleFollowing}
              onUserMove={() => {}}
              speed={speed}
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="text-center">
                <FaSpinner className="animate-spin text-[#12B2E4] text-4xl mx-auto" />
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading map...</p>
              </div>
            </div>
          )}
        </Suspense>

        {/* ─── Back Button ────────────────────────────────────────── */}
        <button
          onClick={goBack}
          className="absolute top-4 left-4 z-[1000] w-10 h-10 rounded-xl bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-white/60 dark:border-gray-700 shadow-lg flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 transition-all touch-manipulation"
        >
          <FaArrowLeft size={18} />
        </button>

        {/* ─── Navigation Status ──────────────────────────────────── */}
        {isNavigating && (
          <div className="absolute top-4 left-16 z-[1000] bg-[#12B2E4] text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-pulse">
            <FaLocationArrow size={14} />
            <span className="text-sm font-semibold">Navigating...</span>
          </div>
        )}

        {/* ─── Map Type Selector ────────────────────────────────── */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1.5">
          {mapTypeButtons.map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => setMapType(type)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-all touch-manipulation flex items-center justify-center ${
                mapType === type
                  ? 'bg-[#12B2E4] text-white shadow-lg shadow-[#12B2E4]/30'
                  : 'bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-white/60 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
              }`}
              title={label}
            >
              {icon}
            </button>
          ))}
        </div>

        {/* ─── Speed Indicator ──────────────────────────────────── */}
        <div className="absolute left-4 bottom-24 z-[1000] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-white/60 dark:border-gray-700 rounded-xl px-4 py-2 shadow-lg flex items-center gap-3">
          <FaCompass size={16} className="text-[#12B2E4]" />
          <span className="text-lg font-bold text-[#12B2E4]">{speed}</span>
          <span className="text-xs text-gray-400 dark:text-gray-500">km/h</span>
        </div>

        {/* ─── Error Message ────────────────────────────────────── */}
        {error && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-2 rounded-xl shadow-lg text-sm max-w-md text-center">
            {error}
          </div>
        )}

        {/* ─── Bottom Info Panel ────────────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>Progress</span>
              <span className="font-semibold text-[#12B2E4]">{Math.round(progressPercentage)}%</span>
            </div>
            <div className="relative h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#12B2E4] to-[#2B4B9E] transition-all duration-700 ease-out"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white dark:bg-gray-800 shadow-[0_2px_8px_rgba(18,178,228,0.4)] border-2 border-[#12B2E4] transition-all duration-700 ease-out"
                style={{ left: `${Math.min(Math.max(progressPercentage, 2), 98)}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 text-xs mb-3">
            <div>
              <p className="text-gray-400 dark:text-gray-500">Next Stop</p>
              <p className="font-semibold text-gray-800 dark:text-white truncate">{trip.nextStop}</p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-gray-500">ETA</p>
              <p className="font-semibold text-[#12B2E4]">{trip.etaFormatted}</p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-gray-500">Distance</p>
              <p className="font-semibold text-gray-800 dark:text-white">{trip.remainingKm.toFixed(1)} km</p>
            </div>
            <div>
              <p className="text-gray-400 dark:text-gray-500">Traffic</p>
              <p className={`font-semibold flex items-center gap-1 ${tStyle.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${tStyle.dot}`} />
                {trafficStatus.charAt(0).toUpperCase() + trafficStatus.slice(1)}
              </p>
            </div>
          </div>

          {/* Map Stops List */}
          {trip.routeStopNames && trip.routeStopNames.length > 0 && (
            <div className="mt-2 pt-3 border-t border-gray-100 dark:border-gray-700/50 flex flex-nowrap overflow-x-auto pb-1 gap-2 no-scrollbar">
              {trip.routeStopNames.map((stopName, idx) => {
                const isPassed = idx < trip.currentStop;
                const isCurrent = idx === trip.currentStop;
                
                return (
                  <div key={idx} className={`shrink-0 flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    isPassed ? 'bg-gray-100 text-gray-400 border-transparent dark:bg-gray-800 dark:text-gray-500' :
                    isCurrent ? 'bg-[#12B2E4]/10 text-[#12B2E4] border-[#12B2E4]/30' :
                    'bg-white text-gray-600 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600'
                  }`}>
                    {idx + 1}. {stopName}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RouteMapPage;