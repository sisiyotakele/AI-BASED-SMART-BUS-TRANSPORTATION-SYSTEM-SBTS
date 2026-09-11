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
  const compactRouteName = option.isMergedRoute && option.legs?.length
    ? option.legs.map((leg) => leg.busNumber.match(/^Route\s+\d+/)?.[0] || leg.busNumber).join(" + ")
    : option.busNumber.match(/^Route\s+\d+/)?.[0] || option.busNumber;

  return (
    <>
      <div
        className={`w-full min-w-0 bg-white border rounded-2xl p-4 shadow-xs transition-all flex flex-col justify-between gap-3 ${
          isSelected
            ? "border-[#2B4B9E] ring-2 ring-[#2B4B9E]/20 shadow-md"
            : "border-slate-200/90 hover:border-[#12B2E4] hover:shadow-sm"
        }`}
      >
        {/* ── TOP: Route name + badge + fare ───── */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-2 rounded-xl shrink-0 ${isDirect ? "bg-indigo-50 text-[#2B4B9E]" : "bg-sky-50 text-[#12B2E4]"}`}>
              {isDirect ? <Bus className="w-4 h-4" /> : <GitMerge className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h4 className="font-extrabold text-slate-900 text-sm truncate leading-tight">{compactRouteName}</h4>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full text-white inline-block mt-0.5 ${isDirect ? "bg-emerald-500" : "bg-sky-500"}`}>
                {isDirect ? "Direct Route" : `${option.transfersCount} Transfer`}
              </span>
            </div>
          </div>
          <span className="text-base font-black shrink-0 text-[#2B4B9E]">{option.fare}</span>
        </div>

        {/* ── ROUTE VIA PATH ───── */}
        <div className="bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">Path</span>
          <p className="text-xs font-extrabold text-slate-900 break-words leading-relaxed mt-0.5">{option.routeVia}</p>
        </div>

        {/* ── ESSENTIAL TIMING ───── */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-700 bg-indigo-50/40 px-3 py-2 rounded-xl border border-indigo-100">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#2B4B9E]" />
            ETA: <strong className="text-slate-900">{option.busEtaMinutes} min</strong>
          </span>
          <span className="text-slate-400">•</span>
          <span>Trip: <strong className="text-slate-900">~{option.totalTripMinutes} min</strong></span>
        </div>

        {/* ── ACTIONS ───── */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="text-xs font-extrabold flex items-center gap-1 cursor-pointer py-1.5 px-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-[#2B4B9E]" />
            Full Details
          </button>
          <button
            type="button"
            onClick={() => onSelectRoute?.(option)}
            className={`text-xs font-extrabold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer text-white shadow-2xs ${
              isSelected ? "bg-emerald-600 hover:bg-emerald-700" : ""
            }`}
            style={!isSelected ? { background: "#2B4B9E" } : undefined}
          >
            <span>{isSelected ? "Selected ✓" : "Select Route"}</span>
            {!isSelected && <ArrowRight className="w-3.5 h-3.5" />}
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
