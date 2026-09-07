// src/features/route-search/BusTrackingModal.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Bus,
  Clock,
  MapPin,
  Radio,
  Navigation,
  Wifi,
  AlertCircle,
  CheckCircle2,
  ChevronUp,
} from "lucide-react";

import { subscribeToBus, BusLocationUpdate } from "@/lib/socket";

interface IncomingBus {
  busId: string;
  routeNumber: string;
  destination: string;
  etaMinutes: number;
  status: "On Time" | "Delayed" | "Offline";
  delayReason?: string;
}

interface BusStop {
  id: string;
  name: string;
  distanceMeters: number;
  routes: string[];
}

interface BusTrackingModalProps {
  bus: IncomingBus;
  stop: BusStop;
  onClose: () => void;
}

/* Animated map stops along the route */
const ROUTE_STOPS = [
  { label: "Bole Medhanealem", pct: 0 },
  { label: "Edna Mall", pct: 18 },
  { label: "CMC Roundabout", pct: 36 },
  { label: "Goro", pct: 55 },
  { label: "Megenagna", pct: 72 },
];

export const BusTrackingModal: React.FC<BusTrackingModalProps> = ({
  bus,
  stop,
  onClose,
}) => {
  const [etaSeconds, setEtaSeconds] = useState(bus.etaMinutes * 60);
  const [busProgress, setBusProgress] = useState(42); // 0–100 along the route
  const [ping, setPing] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* Subscribe to live socket GPS for this specific bus */
  useEffect(() => {
    if (!bus.busId) return;
    const unsubscribe = subscribeToBus(bus.busId, (update: BusLocationUpdate) => {
      setPing(true);
      if (update.location?.speed) {
        // adjust speed progress dynamically
        setBusProgress((p) => Math.min(95, p + 1.2));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [bus.busId]);

  /* Countdown ETA */
  useEffect(() => {
    if (bus.status === "Offline") return;
    intervalRef.current = setInterval(() => {
      setEtaSeconds((s) => Math.max(0, s - 1));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [bus.status]);

  /* Slowly advance bus along the route line */
  useEffect(() => {
    if (bus.status === "Offline") return;
    progressRef.current = setInterval(() => {
      setBusProgress((p) => Math.min(p + 0.06, 96));
    }, 300);
    return () => {
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [bus.status]);

  /* Ping blink */
  useEffect(() => {
    const t = setInterval(() => setPing((p) => !p), 900);
    return () => clearInterval(t);
  }, []);


  const etaMins = Math.floor(etaSeconds / 60);
  const etaSecs = etaSeconds % 60;

  const statusColor =
    bus.status === "On Time"
      ? { text: "#34D399", bg: "rgba(52,211,153,0.15)", border: "rgba(52,211,153,0.3)" }
      : bus.status === "Delayed"
      ? { text: "#60A5FA", bg: "rgba(96,165,250,0.15)", border: "rgba(96,165,250,0.3)" }
      : { text: "#FDA4AF", bg: "rgba(253,164,175,0.15)", border: "rgba(253,164,175,0.3)" };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {/* Modal */}
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        style={{ background: "linear-gradient(180deg, #1C3D6E 0%, #16325C 100%)", maxHeight: "92vh" }}
      >
        {/* ── HEADER ─────────────────────────────── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-xl"
              style={{ backgroundColor: "rgba(56,189,248,0.15)" }}
            >
              <Radio
                className="w-5 h-5 animate-pulse"
                style={{ color: "#38BDF8" }}
              />
            </div>
            <div>
              <p
                className="text-xs font-black uppercase tracking-widest"
                style={{ color: "#38BDF8" }}
              >
                Live Tracking
              </p>
              <h2 className="text-lg font-black text-white leading-tight">
                {bus.routeNumber}{" "}
                <span className="text-sm font-bold text-slate-300">
                  ({bus.busId})
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Signal indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#3B67A4]/60 bg-[#254676]/60">
              <Wifi
                className="w-3.5 h-3.5"
                style={{ color: ping ? "#38BDF8" : "rgba(56,189,248,0.3)" }}
              />
              <span
                className="text-xs font-bold"
                style={{ color: "#7DD3FC" }}
              >
                LIVE
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── MAP AREA ───────────────────────────── */}
        <div className="relative mx-4 mt-4 rounded-2xl overflow-hidden border border-[#325B96]" style={{ height: 210 }}>
          {/* Map background — stylised grid */}
          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(135deg, #0F2744 0%, #122E55 100%)",
              backgroundImage: `
                linear-gradient(rgba(56,189,248,0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(56,189,248,0.05) 1px, transparent 1px)
              `,
              backgroundSize: "28px 28px",
            }}
          />

          {/* Road lines (decorative SVG) */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 210" preserveAspectRatio="none">
            {/* background roads */}
            <line x1="0" y1="140" x2="400" y2="140" stroke="rgba(255,255,255,0.06)" strokeWidth="14" />
            <line x1="80" y1="0" x2="80" y2="210" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
            <line x1="250" y1="0" x2="250" y2="210" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
            <line x1="0" y1="60" x2="400" y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="8" />

            {/* Main route line */}
            <line
              x1="20" y1="105"
              x2="380" y2="105"
              stroke="rgba(56,189,248,0.25)"
              strokeWidth="6"
              strokeDasharray="10 6"
            />
            {/* Completed route (progress) */}
            <line
              x1="20" y1="105"
              x2={20 + (busProgress / 100) * 360}
              y2="105"
              stroke="#38BDF8"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </svg>

          {/* Stop dots along route */}
          {ROUTE_STOPS.map((s) => {
            const x = 20 + (s.pct / 100) * 360;
            const passed = busProgress > s.pct + 2;
            return (
              <div
                key={s.label}
                className="absolute flex flex-col items-center"
                style={{ left: `${(x / 400) * 100}%`, top: "50%", transform: "translate(-50%, -50%)" }}
              >
                <div
                  className="w-3 h-3 rounded-full border-2 border-[#1C3D6E]"
                  style={{ backgroundColor: passed ? "#38BDF8" : "rgba(255,255,255,0.25)" }}
                />
                <span
                  className="text-[9px] font-bold mt-1 whitespace-nowrap"
                  style={{ color: passed ? "#7DD3FC" : "rgba(255,255,255,0.4)" }}
                >
                  {s.label}
                </span>
              </div>
            );
          })}

          {/* Destination pin */}
          <div
            className="absolute flex flex-col items-center"
            style={{ right: "3%", top: "50%", transform: "translateY(-50%)" }}
          >
            <MapPin className="w-5 h-5 text-[#38BDF8]" />
            <span className="text-[9px] font-bold text-[#7DD3FC] mt-0.5 whitespace-nowrap">
              {stop.name}
            </span>
          </div>

          {/* Animated bus marker */}
          <div
            className="absolute flex flex-col items-center transition-all duration-300"
            style={{
              left: `${((20 + (busProgress / 100) * 360) / 400) * 100}%`,
              top: "50%",
              transform: "translate(-50%, -90%)",
            }}
          >
            {/* Pulse ring */}
            <div className="relative flex items-center justify-center">
              <div
                className="absolute w-8 h-8 rounded-full animate-ping"
                style={{ backgroundColor: "rgba(56,189,248,0.2)" }}
              />
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center shadow-lg z-10"
                style={{ backgroundColor: "#38BDF8" }}
              >
                <Bus className="w-4 h-4 text-[#1C3D6E]" />
              </div>
            </div>
            <div
              className="text-[9px] font-black mt-1 px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: "rgba(28,61,110,0.85)", color: "#38BDF8", border: "1px solid rgba(56,189,248,0.4)" }}
            >
              {bus.busId}
            </div>
          </div>

          {/* "You are here" origin */}
          <div
            className="absolute"
            style={{ left: "2%", top: "50%", transform: "translateY(-50%)" }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-white/60" />
          </div>
        </div>

        {/* ── INFO CARDS ─────────────────────────── */}
        <div className="px-4 mt-4 grid grid-cols-3 gap-3">
          {/* ETA */}
          <div className="bg-[#254676]/70 border border-[#3B67A4]/50 rounded-2xl p-3 flex flex-col items-center text-center">
            <Clock className="w-4 h-4 mb-1" style={{ color: "#38BDF8" }} />
            <p className="text-xs text-blue-200 font-bold uppercase tracking-wide">ETA</p>
            {bus.status === "Offline" ? (
              <p className="text-lg font-black text-white mt-0.5">N/A</p>
            ) : (
              <p className="text-lg font-black text-white mt-0.5 tabular-nums">
                {String(etaMins).padStart(2, "0")}:
                <span className="text-base">{String(etaSecs).padStart(2, "0")}</span>
              </p>
            )}
          </div>

          {/* Status */}
          <div
            className="rounded-2xl p-3 flex flex-col items-center text-center border"
            style={{ backgroundColor: statusColor.bg, borderColor: statusColor.border }}
          >
            {bus.status === "On Time" ? (
              <CheckCircle2 className="w-4 h-4 mb-1" style={{ color: statusColor.text }} />
            ) : bus.status === "Delayed" ? (
              <AlertCircle className="w-4 h-4 mb-1" style={{ color: statusColor.text }} />
            ) : (
              <AlertCircle className="w-4 h-4 mb-1" style={{ color: statusColor.text }} />
            )}
            <p className="text-xs font-bold uppercase tracking-wide" style={{ color: statusColor.text }}>
              Status
            </p>
            <p className="text-sm font-black mt-0.5" style={{ color: statusColor.text }}>
              {bus.status}
            </p>
          </div>

          {/* Destination */}
          <div className="bg-[#254676]/70 border border-[#3B67A4]/50 rounded-2xl p-3 flex flex-col items-center text-center">
            <Navigation className="w-4 h-4 mb-1" style={{ color: "#38BDF8" }} />
            <p className="text-xs text-blue-200 font-bold uppercase tracking-wide">Heading To</p>
            <p className="text-sm font-black text-white mt-0.5 leading-tight line-clamp-2">
              {bus.destination}
            </p>
          </div>
        </div>

        {/* Delay notice */}
        {bus.status === "Delayed" && bus.delayReason && (
          <div className="mx-4 mt-3 px-4 py-2.5 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#60A5FA] shrink-0" />
            <p className="text-xs text-[#93C5FD] font-medium">{bus.delayReason}</p>
          </div>
        )}

        {/* ── ARRIVING AT ───────────────────────── */}
        <div className="mx-4 mt-3 mb-5 flex items-center justify-between px-4 py-3 rounded-2xl border border-[#3B67A4]/50 bg-[#254676]/50">
          <div className="flex items-center gap-2.5">
            <ChevronUp className="w-4 h-4 text-[#38BDF8]" />
            <div>
              <p className="text-xs text-blue-200 font-bold">Arriving at</p>
              <p className="text-sm font-black text-white">{stop.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-extrabold text-white transition-all cursor-pointer border border-[#4B79BD]/60 bg-[#335990] hover:bg-[#3D68A6]"
          >
            Stop Tracking
          </button>
        </div>
      </div>
    </div>
  );
};

export default BusTrackingModal;
