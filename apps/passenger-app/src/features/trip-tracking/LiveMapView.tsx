// src/features/trip-tracking/LiveMapView.tsx
import React, { useState, useEffect } from "react";
import { 
  MapPin, 
  Radio, 
  Maximize2, 
  Clock, 
  CheckCircle2, 
  Bus,
  Minimize2,
  Play,
  Pause,
  RotateCcw,
  Compass,
  Zap,
  Users,
  Navigation2,
  Plus,
  Minus,
  Target
} from "lucide-react";

interface Stop {
  id: string;
  name: string;
  time: string;
  coords: { x: number; y: number }; // Percentage along the map canvas
  passengersWaiting: number;
  status: "completed" | "current" | "upcoming";
}

export const LiveMapView: React.FC = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSimulating, setIsSimulating] = useState(true);
  const [busProgress, setBusProgress] = useState(48); // Progress percentage 0 - 100%
  const [zoomLevel, setZoomLevel] = useState(1);
  const [activeStopTooltip, setActiveStopTooltip] = useState<string | null>(null);

  // Route stops data matching Sheger Bus Route 12 (Megenagna → Bole Airport)
  const stops: Stop[] = [
    { id: "1", name: "Megenagna Terminal", time: "06:35 AM", coords: { x: 8, y: 35 }, passengersWaiting: 12, status: "completed" },
    { id: "2", name: "Edna Mall Bypass", time: "06:51 AM", coords: { x: 24, y: 55 }, passengersWaiting: 8, status: "completed" },
    { id: "3", name: "Bole Atlas Station", time: "07:08 AM", coords: { x: 38, y: 40 }, passengersWaiting: 15, status: "completed" },
    { id: "4", name: "CMC Michael Stop", time: "07:24 AM", coords: { x: 54, y: 65 }, passengersWaiting: 22, status: "current" },
    { id: "5", name: "Bole Medhanealem", time: "07:41 AM", coords: { x: 70, y: 45 }, passengersWaiting: 19, status: "upcoming" },
    { id: "6", name: "Friendship Center", time: "07:55 AM", coords: { x: 84, y: 60 }, passengersWaiting: 9, status: "upcoming" },
    { id: "7", name: "Bole International Airport", time: "08:12 AM", coords: { x: 94, y: 40 }, passengersWaiting: 4, status: "upcoming" },
  ];

  // Smooth Live GPS movement simulation loop
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setBusProgress((prev) => {
        if (prev >= 94) return 8; // Reset back to start when reaching final stop
        return prev + 0.35; // Increment position smoothly
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isSimulating]);

  // Calculate live telemetry values based on bus progress
  const currentSpeed = Math.round(36 + Math.sin(busProgress / 5) * 8);
  const currentLat = (9.005 + (busProgress * 0.00035)).toFixed(4);
  const currentLng = (38.765 + (busProgress * 0.00042)).toFixed(4);
  const nextStopEtaMinutes = Math.max(1, Math.round((55 - busProgress) * 0.3));

  // Determine current active stop based on progress percentage
  const currentStopIndex = Math.min(
    stops.length - 1,
    Math.floor((busProgress / 100) * stops.length)
  );

  return (
    <div className={`flex flex-col justify-between transition-all ${
      isFullscreen ? "fixed inset-0 z-50 bg-white p-6 overflow-y-auto" : ""
    }`}>
      {/* 1. MAP HEADER & REAL-TIME CONTROLS */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              Real-Time GPS Fleet Tracker
              <span className="text-xs text-slate-400 font-normal hidden sm:inline">
                • Route 12 Express (SBTS-BUS-114)
              </span>
            </h3>
          </div>
        </div>

        {/* Live GPS Telemetry Badges & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Live Signal Badge */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
            GPS Active (±3m)
          </span>

          {/* Simulation Toggle Controls */}
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-xl border transition-all cursor-pointer ${
              isSimulating
                ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
            }`}
            title={isSimulating ? "Pause GPS Motion" : "Resume GPS Motion"}
          >
            {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isSimulating ? "Pause Simulation" : "Play GPS"}</span>
          </button>

          {/* Reset Bus Position */}
          <button
            onClick={() => setBusProgress(8)}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
            title="Reset Bus Location to Origin"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-1.5 text-xs text-slate-700 font-bold px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                Full Screen
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. HIGH-REALISM CARTOGRAPHIC MAP CANVAS */}
      <div className="relative w-full h-80 sm:h-96 bg-[#e6edea] rounded-2xl overflow-hidden border border-slate-200/90 shadow-inner select-none">
        
        {/* Realistic Cartographic Background Layers */}
        <div 
          className="absolute inset-0 bg-[#e4ebe8] transition-transform duration-300"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          {/* Subtle topography street grid */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#cbd5e125_1px,transparent_1px),linear-gradient(to_bottom,#cbd5e125_1px,transparent_1px)] bg-[size:32px_32px]"></div>

          {/* Major Addis Ababa Road Lines Simulation */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            {/* Background Secondary Arterial Roads (Gray Lines) */}
            <path d="M 0,120 Q 250,90 500,160 T 1000,100" fill="none" stroke="#cbd5e1" strokeWidth="8" />
            <path d="M 100,0 Q 180,200 400,350" fill="none" stroke="#cbd5e1" strokeWidth="6" />
            <path d="M 600,0 Q 650,220 850,380" fill="none" stroke="#cbd5e1" strokeWidth="6" />

            {/* Main Ring Road Highway (Yellow Border Expressway) */}
            <path d="M 30,140 C 200,80 400,220 600,120 S 850,200 970,140" fill="none" stroke="#fde047" strokeWidth="12" strokeLinecap="round" />
            
            {/* Active Bus Route Path (Cyan & Indigo Track) */}
            <path d="M 30,140 C 200,80 400,220 600,120 S 850,200 970,140" fill="none" stroke="#6366f1" strokeWidth="6" strokeLinecap="round" />
            
            {/* Traveled Completed Distance Path (Emerald Overlay) */}
            <path 
              d="M 30,140 C 200,80 400,220 600,120 S 850,200 970,140" 
              fill="none" 
              stroke="#10b981" 
              strokeWidth="6" 
              strokeDasharray="1000"
              strokeDashoffset={1000 - (busProgress / 100) * 1000}
              strokeLinecap="round"
            />
          </svg>

          {/* Interactive Bus Station Map Markers */}
          {stops.map((stop, index) => {
            const isCurrent = index === currentStopIndex;
            const isPassed = index < currentStopIndex;

            return (
              <div
                key={stop.id}
                style={{ left: `${stop.coords.x}%`, top: `${stop.coords.y}%` }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer group"
                onClick={() => setActiveStopTooltip(activeStopTooltip === stop.id ? null : stop.id)}
              >
                {/* Station Marker Circle */}
                <div className={`relative flex items-center justify-center transition-all ${
                  isCurrent 
                    ? "w-8 h-8 bg-emerald-500 rounded-full border-2 border-white shadow-lg text-white ring-4 ring-emerald-500/20 scale-110"
                    : isPassed
                    ? "w-6 h-6 bg-indigo-600 rounded-full border-2 border-white text-white shadow-xs"
                    : "w-5 h-5 bg-white rounded-full border-2 border-slate-400 text-slate-600 shadow-xs group-hover:scale-125"
                }`}>
                  {isPassed ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : isCurrent ? (
                    <span className="w-2.5 h-2.5 bg-white rounded-full animate-ping"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                  )}
                </div>

                {/* Station Name Label Tag */}
                <div className="absolute top-7 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-xs px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs whitespace-nowrap text-[10px] font-bold text-slate-800 pointer-events-none">
                  {stop.name}
                </div>

                {/* Popover Tooltip when clicked */}
                {activeStopTooltip === stop.id && (
                  <div className="absolute bottom-9 left-1/2 -translate-x-1/2 w-48 bg-slate-900 text-white rounded-xl p-3 shadow-2xl z-50 text-xs space-y-1 animate-in fade-in duration-150">
                    <div className="font-bold flex items-center justify-between border-b border-slate-700 pb-1 text-emerald-400">
                      <span>{stop.name}</span>
                      <span className="text-[10px] text-slate-300 font-mono">{stop.time}</span>
                    </div>
                    <p className="text-[10px] text-slate-300">
                      Passengers waiting: <strong className="text-white">{stop.passengersWaiting} people</strong>
                    </p>
                    <p className="text-[10px] text-slate-300">
                      Status: <strong className="capitalize text-indigo-300">{stop.status}</strong>
                    </p>
                  </div>
                )}
              </div>
            );
          })}

          {/* DYNAMIC REAL-TIME BUS MARKER (Smooth Live GPS Movement) */}
          <div
            style={{ 
              left: `${busProgress}%`, 
              top: `${40 + Math.sin(busProgress / 8) * 15}%` 
            }}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30 transition-all duration-300 ease-linear"
          >
            {/* GPS Pulse Rings */}
            <div className="absolute -inset-3 bg-indigo-500/20 rounded-full animate-ping"></div>
            <div className="absolute -inset-6 bg-indigo-500/10 rounded-full animate-pulse"></div>

            {/* Active Vehicle Badge */}
            <div className="relative bg-indigo-600 text-white p-2.5 rounded-2xl shadow-2xl border-2 border-white flex items-center gap-1.5 transform hover:scale-110 cursor-pointer">
              <Bus className="w-5 h-5 animate-bounce" />
              <span className="text-[10px] font-extrabold pr-1 hidden sm:inline">SBTS-BUS-114</span>
            </div>

            {/* Vehicle Floating Info Card */}
            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-slate-900/90 text-white px-2.5 py-1 rounded-xl shadow-lg border border-slate-700 text-[10px] font-extrabold whitespace-nowrap flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span>{currentSpeed} km/h</span>
              <span className="text-slate-400">|</span>
              <span className="text-indigo-300">Route 12</span>
            </div>
          </div>
        </div>

        {/* 3. FLOATING OVERLAY: LIVE TELEMETRY DASHBOARD PANEL */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200/90 shadow-md z-30 max-w-xs space-y-1.5 text-xs text-slate-800">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 gap-3">
            <span className="font-bold text-slate-900 flex items-center gap-1 text-[11px]">
              <Navigation2 className="w-3.5 h-3.5 text-indigo-600 transform rotate-45" />
              Live Telemetry
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Online
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] font-medium pt-0.5">
            <div>
              <span className="text-slate-400 block">Coordinates:</span>
              <span className="font-mono font-bold text-slate-800">{currentLat}°N, {currentLng}°E</span>
            </div>
            <div>
              <span className="text-slate-400 block">Vehicle Speed:</span>
              <span className="font-bold text-amber-600">{currentSpeed} km/h</span>
            </div>
            <div>
              <span className="text-slate-400 block">Next Station:</span>
              <span className="font-bold text-indigo-600 truncate block">CMC Michael</span>
            </div>
            <div>
              <span className="text-slate-400 block">Arrival ETA:</span>
              <span className="font-bold text-emerald-600">~{nextStopEtaMinutes} mins</span>
            </div>
          </div>
        </div>

        {/* 4. MAP ZOOM CONTROLS (BOTTOM RIGHT) */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-30">
          <button
            onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.15))}
            className="p-2 bg-white/95 hover:bg-white text-slate-700 rounded-xl border border-slate-200 shadow-md transition-colors cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel((z) => Math.max(0.85, z - 0.15))}
            className="p-2 bg-white/95 hover:bg-white text-slate-700 rounded-xl border border-slate-200 shadow-md transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="p-2 bg-white/95 hover:bg-white text-indigo-600 rounded-xl border border-slate-200 shadow-md transition-colors cursor-pointer"
            title="Recenter Map"
          >
            <Target className="w-4 h-4" />
          </button>
        </div>

        {/* 5. MAP LEGEND OVERLAY (BOTTOM LEFT) */}
        <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-xs px-3.5 py-1.5 rounded-xl border border-slate-200/90 text-[11px] font-medium text-slate-600 flex items-center gap-4 shadow-xs z-30">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Passed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Active Bus
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> Upcoming Stop
          </span>
        </div>
      </div>

      {/* 3. HORIZONTAL REAL-TIME ROUTE STOP TIMELINE */}
      <div className="mt-4 pt-4 border-t border-slate-100 overflow-x-auto scrollbar-none">
        <div className="flex items-center gap-2.5 min-w-max pb-1">
          {stops.map((stop, index) => {
            const isCurrent = index === currentStopIndex;
            const isPassed = index < currentStopIndex;

            return (
              <div
                key={stop.id}
                onClick={() => setActiveStopTooltip(stop.id)}
                className={`px-3.5 py-2.5 rounded-2xl text-center border transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-900 shadow-2xs font-bold ring-2 ring-emerald-500/20"
                    : isPassed
                    ? "bg-slate-50 border-slate-200/80 text-slate-700"
                    : "bg-white border-slate-200/60 text-slate-400"
                }`}
              >
                <div className="text-xs font-bold whitespace-nowrap flex items-center justify-center gap-1">
                  {isPassed && <CheckCircle2 className="w-3 h-3 text-indigo-600 inline" />}
                  {stop.name}
                </div>
                <div className="text-[10px] font-medium opacity-80 mt-1 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 inline" />
                  {stop.time}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LiveMapView;