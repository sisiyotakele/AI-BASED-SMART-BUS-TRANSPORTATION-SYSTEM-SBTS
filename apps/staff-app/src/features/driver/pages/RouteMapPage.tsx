// src/features/driver/pages/RouteMapPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaCompass,
  FaExpand,
  FaCompress,
  FaBus,
  FaClock,
  FaRoute,
  FaArrowLeft,
  FaLocationArrow,
  FaPlus,
  FaMinus,
  FaCrosshairs,
} from 'react-icons/fa';
import { RouteMapView } from '../components/map';
import { useRouteTracking } from '../hooks/useRouteTracking';
import { useDriverProfile } from '../hooks';
import { MapType, TRAFFIC_STYLES, STOPS, STOP_NAMES, BUS_ID, TOTAL_DISTANCE_KM } from '../constants/map';
import { DEFAULT_DRIVER } from '../constants/driver';

const RouteMapPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useDriverProfile();
  const {
    trip,
    speed,
    trafficStatus,
    trafficDelay,
    trafficSuggestion,
    isFollowing,
    toggleFollowing,
  } = useRouteTracking();

  const [mapType, setMapType] = useState<MapType>("street");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const driverName = profile.name || DEFAULT_DRIVER.name;
  const tStyle = TRAFFIC_STYLES[trafficStatus];
  const progressPercentage = trip.progressPercentage;

  // ─── Check if navigation was triggered from MyTripPage ────────
  const isNavigating = location.state?.startNavigation || false;

  // ─── Map type buttons ──────────────────────────────────────────
  const mapTypeButtons: Array<{ type: MapType; label: string; icon: string }> = [
    { type: 'street', label: 'Street', icon: '🗺️' },
    { type: 'satellite', label: 'Satellite', icon: '🛰️' },
    { type: 'terrain', label: 'Terrain', icon: '⛰️' },
    { type: 'dark', label: 'Dark', icon: '🌙' },
  ];

  // ─── Go back to MyTripPage ─────────────────────────────────────
  const goBack = () => {
    navigate('/driver');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden">
      {/* ─── Full Screen Map ────────────────────────────────────── */}
      <div className="relative h-screen w-full">
        <RouteMapView
          position={trip.position}
          stops={STOPS}
          stopNames={STOP_NAMES}
          currentStop={trip.currentStop}
          progress={progressPercentage}
          following={isFollowing}
          mapType={mapType}
          onMapTypeChange={setMapType}
          onFollowToggle={toggleFollowing}
          onUserMove={() => {}}
          speed={speed}
        />

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

        {/* ─── Bottom Info Panel ────────────────────────────────── */}
        <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border-t border-gray-200 dark:border-gray-700 p-4">
          {/* Progress Bar */}
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

          {/* Info Grid */}
          <div className="grid grid-cols-4 gap-2 text-xs">
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
                {trafficStatus}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteMapPage;