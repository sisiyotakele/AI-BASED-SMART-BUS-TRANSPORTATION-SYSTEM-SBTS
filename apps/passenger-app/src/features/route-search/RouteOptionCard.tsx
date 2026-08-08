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
  ChevronDown, 
  ChevronUp,
  Footprints
} from "lucide-react";

interface RouteOptionCardProps {
  option: RouteOption;
  destinationName: string;
  onSelectRoute?: (option: RouteOption) => void;
}

export const RouteOptionCard: React.FC<RouteOptionCardProps> = ({
  option,
  destinationName,
  onSelectRoute,
}) => {
  const [showLegs, setShowLegs] = useState<boolean>(false);

  const getCrowdBadge = (level: RouteOption["crowdLevel"]) => {
    switch (level) {
      case "Low":
        return "bg-white  text-indigo-600 border-amber";
      case "Medium":
        return "bg-white  text-indigo-600 border-amber";
      case "High":
        return "bg-white  text-indigo-600 border-amber";
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-2xs hover:border-indigo-300 transition-all flex flex-col justify-between gap-3">
      
      {/* Top Header: Route Title, Transfer Badge & Fare */}
      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className={`p-2 rounded-xl shrink-0 ${
            option.isMergedRoute ? "bg-amber-50 text-indigo-600" : "bg-indigo-50 text-indigo-600"
          }`}>
            {option.isMergedRoute ? <GitMerge className="w-4 h-4" /> : <Bus className="w-4 h-4" />}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm truncate">
                {option.busNumber}
              </h4>
              {option.isMergedRoute ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-indigo-600 border border-amber shrink-0">
                  {option.transfersCount} {option.transfersCount === 1 ? "Transfer" : "Transits"} Merged
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                  Direct Route
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{option.routeVia}</p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs font-black text-indigo-900 block leading-tight">{option.fare}</span>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${getCrowdBadge(
              option.crowdLevel
            )}`}
          >
            {option.crowdLevel} Crowd
          </span>
        </div>
      </div>

      {/* Walking Info to Boarding Station */}
      <div className="bg-slate-50/80 rounded-lg px-3 py-1.5 flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2 min-w-0">
          <Navigation className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <div className="truncate">
            <span className="font-bold text-slate-800">Board at: </span>
            <span className="text-slate-600 font-medium">{option.nearestStation.name}</span>
            <span className="text-slate-400 text-[10px] ml-1">
              ({option.nearestStation.distanceMeters}m)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 font-bold text-emerald-600 shrink-0">
          <Clock className="w-3 h-3" />
          <span>{option.nearestStation.walkTimeMinutes}m walk</span>
        </div>
      </div>

      {/* Arrival & Trip Duration Compact Grid */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="p-2 border border-slate-100 rounded-lg bg-white">
          <span className="text-[9px] font-bold uppercase text-slate-400 block leading-none mb-1">
            First Bus Arrival
          </span>
          <span className="text-xs font-extrabold flex items-center gap-1 leading-none">
            <Clock className="w-3 h-3" />
            in {option.busEtaMinutes} mins
          </span>
        </div>

        <div className="p-2 border border-slate-100 rounded-lg bg-white">
          <span className="text-[9px] font-bold uppercase text-slate-400 block leading-none mb-1">
            Total Trip Duration
          </span>
          <span className="text-xs font-extrabold text-slate-800 leading-none">
            ~{option.totalTripMinutes} mins
          </span>
        </div>
      </div>

      {/* MERGED ROUTE MULTI-LEG BREAKDOWN (If present) */}
      {option.isMergedRoute && option.legs && option.legs.length > 0 && (
        <div className="border text-indigo-900 bg-amber-50/40 rounded-xl overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setShowLegs(!showLegs)}
            className="w-full px-3 py-2 flex items-center justify-between text-slate-800 font-bold hover:bg-white transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5 text-[11px]">
              <GitMerge className="w-3.5 h-3.5 text-indigo-900" />
              {showLegs ? "Hide Transit Leg Details" : `View ${option.legs.length}-Leg Merged Transit Steps`}
            </span>
            {showLegs ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {showLegs && (
            <div className="p-3 border-t border-indigo-900 bg-white space-y-2.5 animate-in fade-in duration-150">
              {option.legs.map((leg, index) => (
                <div key={leg.legIndex} className="space-y-1.5">
                  
                  {/* Transfer Wait Banner between legs */}
                  {index > 0 && (
                    <div className="my-1.5 px-2.5 py-1 rounded-lg bg-white border text-indigo-900 text-[10px] font-bold text-indigo-900 flex items-center gap-1.5">
                      <Footprints className="w-3 h-3 text-indigo-900" />
                      <span>
                        Transfer at <strong>{leg.fromStation}</strong> (~{leg.transferWaitMinutes || 4} min wait)
                      </span>
                    </div>
                  )}

                  {/* Leg Detail Card */}
                  <div className="p-2.5 rounded-lg border border-slate-200/80 bg-slate-50/80 flex items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                        <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[9px] flex items-center justify-center font-bold">
                          {leg.legIndex}
                        </span>
                        <span>{leg.busNumber}</span>
                        <span className="text-[10px] text-slate-400 font-medium">({leg.busType})</span>
                      </div>
                      <div className="text-[11px] text-slate-600 flex items-center gap-1">
                        <span>{leg.fromStation}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400 inline" />
                        <span>{leg.toStation}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-slate-800 block">{leg.fare}</span>
                      <span className="text-[10px] font-bold text-emerald-600">~{leg.durationMinutes} min</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 truncate max-w-[170px]">
          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="truncate">To: {destinationName}</span>
        </div>

        <button
          onClick={() => onSelectRoute && onSelectRoute(option)}
          className="bg-[#1B2A4A] hover:bg-[#283863] text-white text-[11px] font-bold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shrink-0"
        >
          <span>Select Route</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export default RouteOptionCard;