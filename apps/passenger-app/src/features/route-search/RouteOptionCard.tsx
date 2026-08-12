// src/features/route-search/RouteOptionCard.tsx
import React, { useState } from "react";
import { RouteOption } from "./types";
import {
  Bus,
  Navigation,
  Clock,
  MapPin,
  ArrowRight,
  GitMerge,
  Info,
  Footprints,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { RouteDetailPopover } from "./RouteDetailPopover";

interface RouteOptionCardProps {
  option: RouteOption;
  destinationName: string;
  isSelected?: boolean;
  onSelectRoute?: (option: RouteOption) => void;
}

const crowdColors: Record<string, string> = {
  Low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Medium: "bg-sky-50 text-[#12B2E4] border-sky-200",
  High: "bg-rose-50 text-rose-700 border-rose-200",
  Moderate: "bg-sky-50 text-[#12B2E4] border-sky-200",
};

// AI Prediction badge styles
const aiStatusConfig = {
  "On Time": {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    icon: <CheckCircle2 className="w-3 h-3 shrink-0" />,
  },
  "Likely Delayed": {
    bg: "bg-sky-50",
    border: "border-sky-200",
    text: "text-[#12B2E4]",
    icon: <AlertTriangle className="w-3 h-3 shrink-0" />,
  },
  "Delayed": {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    icon: <AlertTriangle className="w-3 h-3 shrink-0" />,
  },
};

export const RouteOptionCard: React.FC<RouteOptionCardProps> = ({
  option,
  destinationName,
  isSelected = false,
  onSelectRoute,
}) => {
  const [showDetails, setShowDetails] = useState(false);

  const isDirect = !option.isMergedRoute || option.transfersCount === 0;
  const ai = option.aiTrafficPrediction;
  const aiStyle = ai ? aiStatusConfig[ai.status] : null;

  return (
    <>
      <div
        className={`min-w-[310px] max-w-[340px] shrink-0 bg-white border rounded-2xl p-5 shadow-xs transition-all flex flex-col gap-4 ${
          isSelected
            ? "border-[#2B4B9E] ring-2 ring-[#2B4B9E]/20 shadow-md"
            : "border-slate-200/90 hover:border-[#12B2E4] hover:shadow-sm"
        }`}
      >
        {/* ── TOP: Route name + badge + fare ───── */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3.5">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className={`p-2.5 rounded-xl shrink-0 ${isDirect ? "bg-indigo-50 text-[#2B4B9E]" : "bg-sky-50 text-[#12B2E4]"}`}>
              {isDirect ? <Bus className="w-5 h-5" /> : <GitMerge className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-slate-900 text-base truncate leading-tight">{option.busNumber}</h4>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                {isDirect ? (
                  <span className="text-xs font-extrabold text-white bg-emerald-500 px-2.5 py-0.5 rounded-full">Direct</span>
                ) : (
                  <span className="text-xs font-extrabold text-white px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "#12B2E4" }}>
                    {option.transfersCount} {option.transfersCount === 1 ? "Transfer" : "Transfers"}
                  </span>
                )}
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${crowdColors[option.crowdLevel] ?? crowdColors.Medium}`}>
                  {option.crowdLevel} crowd
                </span>
              </div>
            </div>
          </div>
          <span className="text-base sm:text-lg font-black shrink-0" style={{ color: "#2B4B9E" }}>{option.fare}</span>
        </div>

        {/* ── AI TRAFFIC PREDICTION BADGE ─────── */}
        {ai && aiStyle && (
          <div className={`flex items-start gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-bold ${aiStyle.bg} ${aiStyle.border} ${aiStyle.text}`}>
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#2B4B9E" }} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <span className="font-extrabold flex items-center gap-1.5 text-xs sm:text-sm">
                  {aiStyle.icon}
                  {ai.status}
                  {ai.delayMinutes && ai.delayMinutes > 0 && (
                    <span className="font-bold"> (+{ai.delayMinutes} min)</span>
                  )}
                </span>
                <span className="text-xs font-bold text-slate-500 shrink-0">{ai.confidence}% confidence</span>
              </div>
              {ai.reason && (
                <p className="text-xs text-slate-600 truncate mt-1 font-medium">{ai.reason}</p>
              )}
            </div>
          </div>
        )}

        {/* ── WALK TO STOP ────────────────────── */}
        <div className="flex items-center gap-3 bg-slate-50 rounded-xl px-3.5 py-2.5 border border-slate-100">
          <Footprints className="w-5 h-5 text-indigo-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Walk to stop</p>
            <p className="text-sm font-extrabold text-slate-900 truncate">
              ~{option.nearestStation.walkTimeMinutes} min
              <span className="font-bold text-slate-500 ml-1">({option.nearestStation.distanceMeters}m)</span>
            </p>
            <p className="text-xs text-slate-600 font-medium truncate">{option.nearestStation.name}</p>
          </div>
        </div>

        {/* ── TIMING GRID ─────────────────────── */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="p-2.5 border border-slate-100 rounded-xl bg-slate-50/60">
            <span className="text-xs font-extrabold uppercase text-slate-500 block mb-0.5">Bus arrives</span>
            <span className="text-sm font-black flex items-center gap-1 text-slate-900">
              <Clock className="w-4 h-4 text-indigo-600" />
              {option.busEtaMinutes} min
            </span>
          </div>
          <div className="p-2.5 border border-slate-100 rounded-xl bg-slate-50/60">
            <span className="text-xs font-extrabold uppercase text-slate-500 block mb-0.5">Total trip</span>
            <span className="text-sm font-black text-slate-900">~{option.totalTripMinutes} min</span>
          </div>
        </div>

        {/* ── FULL PATH BREADCRUMB: A → B → D ──── */}
        <div className="rounded-xl border px-3.5 py-3 space-y-1" style={{ background: "#f0f4ff", borderColor: "#2B4B9E22" }}>
          <p className="text-xs font-extrabold uppercase tracking-widest" style={{ color: "#2B4B9E" }}>Route Path</p>
          <p className="text-xs sm:text-sm font-bold text-slate-900 leading-snug break-words">{option.routeVia}</p>
        </div>

        {/* ── DESTINATION ─────────────────────── */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 truncate -mt-1">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">To: {destinationName}</span>
        </div>

        {/* ── ACTIONS ─────────────────────────── */}
        <div className="flex items-center justify-between gap-2.5 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="text-xs sm:text-sm font-extrabold flex items-center gap-1.5 cursor-pointer py-1.5 px-2 hover:bg-slate-100 rounded-lg transition-colors"
            style={{ color: "#2B4B9E" }}
          >
            <Info className="w-4 h-4" />
            Details
          </button>
          <button
            type="button"
            onClick={() => onSelectRoute?.(option)}
            className={`text-xs sm:text-sm font-extrabold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-white shadow-2xs ${
              isSelected ? "bg-emerald-600 hover:bg-emerald-700" : ""
            }`}
            style={!isSelected ? { background: "#2B4B9E" } : undefined}
          >
            <span>{isSelected ? "Selected ✓" : "Select Route"}</span>
            {!isSelected && <ArrowRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {showDetails && (
        <RouteDetailPopover
          option={option}
          destinationName={destinationName}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
};

export default RouteOptionCard;
