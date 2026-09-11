// apps/passenger-app/src/components/TripPlanDetailPopover.tsx
import React, { useEffect } from "react";
import {
  X,
  Bus,
  GitMerge,
  Clock,
  MapPin,
  ArrowRight,
  Footprints,
  Navigation,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export interface TripPlanLeg {
  legIndex: number;
  busNumber: string;
  fromStation: string;
  toStation: string;
  durationMinutes: number;
  transferWaitMinutes?: number;
  busType?: string;
  fare?: string;
}

export interface TripPlanDetailData {
  id: string;
  routeName: string;
  originStop: string;
  destinationStop: string;
  transfers: number;
  totalTimeMin: number;
  nextDepartureMin: number;
  fare?: string;
  viaStops?: string[];
  walkingMinutes?: number;
  isMergedRoute?: boolean;
  legs?: TripPlanLeg[];
  nearestStation?: {
    name?: string;
    distanceMeters?: number;
    walkTimeMinutes?: number;
  };
}

interface TripPlanDetailPopoverProps {
  plan: TripPlanDetailData;
  isOpen: boolean;
  onClose: () => void;
  onSelectRoute: (plan: TripPlanDetailData) => void;
}

export const TripPlanDetailPopover: React.FC<TripPlanDetailPopoverProps> = ({
  plan,
  isOpen,
  onClose,
  onSelectRoute,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isDirect = !plan.isMergedRoute && plan.transfers === 0;

  // Boarding & walking info
  const boardingStation = plan.nearestStation?.name || plan.originStop || "Central Station";
  const walkMinutes = plan.walkingMinutes || plan.nearestStation?.walkTimeMinutes || 3;
  const walkDistance = plan.nearestStation?.distanceMeters || Math.round(walkMinutes * 75);

  // Build full list of stations touched along the way
  const touchedStops: string[] = (() => {
    if (plan.viaStops && plan.viaStops.length > 0) {
      const list = [...plan.viaStops];
      if (!list[0] || list[0].toLowerCase() !== plan.originStop.toLowerCase()) {
        list.unshift(plan.originStop);
      }
      if (list[list.length - 1].toLowerCase() !== plan.destinationStop.toLowerCase()) {
        list.push(plan.destinationStop);
      }
      return list;
    }
    if (plan.legs && plan.legs.length > 0) {
      const list: string[] = [];
      plan.legs.forEach((leg, idx) => {
        if (idx === 0) list.push(leg.fromStation);
        list.push(leg.toStation);
      });
      return list;
    }
    return [plan.originStop, plan.destinationStop];
  })();

  // Find transfer station if not direct
  const transferStation = !isDirect
    ? (plan.legs && plan.legs.length > 1 ? plan.legs[0].toStation : (touchedStops[1] || "Intermediate Station"))
    : null;

  const firstBusName = plan.legs?.[0]?.busNumber || plan.routeName.split("→")[0]?.trim() || plan.routeName;
  const secondBusName = plan.legs?.[1]?.busNumber || plan.routeName.split("→")[1]?.trim() || "Connecting Line";
  const transferWait = plan.legs?.[1]?.transferWaitMinutes || 5;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Dimmed backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />

      {/* Dialog container - Minimized & Compact */}
      <div
        className="relative w-full sm:max-w-md max-h-[80vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl z-10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle indicator */}
        <div className="sm:hidden w-10 h-1 bg-slate-300 rounded-full mx-auto my-2 shrink-0" />

        {/* ── HEADER ── */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-4 py-3 flex items-start justify-between gap-2.5 z-10 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {isDirect ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-extrabold flex items-center gap-1">
                  <Bus className="w-3 h-3" /> Direct Route
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-[#2B4B9E] text-[10px] font-extrabold flex items-center gap-1">
                  <GitMerge className="w-3 h-3" /> {plan.transfers} Transfer Required
                </span>
              )}
            </div>
            <h3 className="font-black text-slate-900 text-base leading-tight truncate">
              {plan.routeName}
            </h3>
            <p className="text-[11px] text-slate-500 font-semibold mt-0.5 flex items-center gap-1 truncate">
              <span>{plan.originStop}</span>
              <ArrowRight className="w-2.5 h-2.5 text-slate-400 shrink-0 inline" />
              <span>{plan.destinationStop}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer shrink-0"
            aria-label="Close details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── BODY CONTENT ── */}
        <div className="p-3.5 space-y-3 flex-1 overflow-y-auto">
          {/* Key Metrics Strip */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">Total Time</span>
              <span className="font-black text-xs text-slate-900">~{plan.totalTimeMin} min</span>
            </div>
            <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 block">Next Bus</span>
              <span className="font-black text-xs text-emerald-700">in {plan.nextDepartureMin}m</span>
            </div>
            <div className="p-2 rounded-xl bg-blue-50/70 border border-blue-100">
              <span className="text-[9px] font-black uppercase tracking-wider text-[#2B4B9E] block">Fare</span>
              <span className="font-black text-xs text-[#2B4B9E]">{plan.fare || "15.00 ETB"}</span>
            </div>
          </div>

          {/* ── WHERE TO WAIT FOR COMING BUS & HOW LONG TO WALK ── */}
          <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/90 text-slate-800 space-y-2 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-amber-900">
                    Where to Wait for Coming Bus
                  </h4>
                  <p className="text-[10px] text-amber-800 font-medium">
                    Boarding station & walking time
                  </p>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full bg-white border border-amber-200 text-amber-800 text-[10px] font-black flex items-center gap-1 shrink-0">
                <Footprints className="w-3 h-3 text-amber-600" />
                ~{walkMinutes}m walk
              </span>
            </div>

            <div className="bg-white/95 rounded-lg p-2.5 border border-amber-200/70 space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 font-medium">Boarding Station:</span>
                <span className="font-black text-slate-900 text-xs text-right truncate">
                  {boardingStation}
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 font-medium">Walking distance:</span>
                <span className="font-extrabold text-slate-800">
                  ~{walkDistance}m (~{walkMinutes} min walk)
                </span>
              </div>

              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500 font-medium">Bus arrival at stop:</span>
                <span className="font-extrabold text-emerald-700">
                  Arriving in ~{plan.nextDepartureMin} minutes
                </span>
              </div>
            </div>
          </div>

          {/* ── IF NOT DIRECT ROUTE: WHERE TO TAKE THE NEXT BUS ── */}
          {!isDirect && (
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 text-slate-800 space-y-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#2B4B9E] text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <GitMerge className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-[#2B4B9E]">
                    Bus Transfer Instructions
                  </h4>
                  <p className="text-[10px] text-slate-600 font-medium">
                    Switch buses at transfer point:
                  </p>
                </div>
              </div>

              {/* Step 1: First bus */}
              <div className="bg-white/90 p-2 rounded-lg border border-blue-100 flex items-start gap-2 text-[11px]">
                <span className="w-4 h-4 rounded-full bg-slate-800 text-white text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">
                    Board <strong>{firstBusName}</strong> at <strong>{plan.originStop}</strong>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    Ride until <strong>{transferStation}</strong>.
                  </p>
                </div>
              </div>

              {/* Transfer Highlight */}
              <div className="bg-amber-50/90 p-2 rounded-lg border border-amber-200 flex items-start gap-2 text-[11px]">
                <div className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  ⇄
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-amber-900">
                    Switch at <strong>{transferStation}</strong> (Transfer Station)
                  </p>
                  <p className="text-[10px] text-amber-800 flex items-center gap-1 font-semibold">
                    <Clock className="w-3 h-3 shrink-0" />
                    <span>Estimated wait: ~{transferWait} minutes</span>
                  </p>
                </div>
              </div>

              {/* Step 2: Next bus */}
              <div className="bg-white/90 p-2 rounded-lg border border-blue-100 flex items-start gap-2 text-[11px]">
                <span className="w-4 h-4 rounded-full bg-[#2B4B9E] text-white text-[9px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900">
                    Take Next Bus: <strong className="text-[#2B4B9E]">{secondBusName}</strong>
                  </p>
                  <p className="text-[10px] text-slate-500">
                    From <strong>{transferStation}</strong> to <strong>{plan.destinationStop}</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ── WHERE IT TOUCHES: FULL CORRIDOR STATIONS LIST ── */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#2B4B9E]" />
                Stations Touched ({touchedStops.length})
              </h4>
              <span className="text-[9px] font-bold text-slate-400">Sequential stops</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 space-y-0 max-h-48 overflow-y-auto">
              {touchedStops.map((stop, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === touchedStops.length - 1;
                const isTransfer = !isDirect && transferStation && stop.toLowerCase() === transferStation.toLowerCase();

                return (
                  <div key={idx} className="relative flex items-start gap-2.5 pb-2.5 last:pb-0">
                    {/* Vertical connecting line */}
                    {!isLast && (
                      <div className="absolute left-2.5 top-4 bottom-0 w-0.5 bg-slate-200" />
                    )}

                    {/* Bullet marker */}
                    <div
                      className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 ${
                        isFirst
                          ? "bg-slate-900 text-white shadow-2xs"
                          : isLast
                          ? "bg-emerald-600 text-white shadow-2xs"
                          : isTransfer
                          ? "bg-amber-500 text-white animate-pulse"
                          : "bg-white border-2 border-slate-300 text-slate-600"
                      }`}
                    >
                      {isFirst ? "A" : isLast ? "B" : isTransfer ? "⇄" : idx + 1}
                    </div>

                    {/* Stop Info */}
                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[11px] truncate ${
                          isFirst || isLast || isTransfer ? "text-slate-900 font-extrabold" : "text-slate-700 font-semibold"
                        }`}>
                          {stop}
                        </p>
                        <span
                          className={`text-[8px] px-1.5 py-0.2 rounded-full font-bold shrink-0 ${
                            isFirst
                              ? "bg-slate-100 text-slate-700"
                              : isLast
                              ? "bg-emerald-100 text-emerald-800"
                              : isTransfer
                              ? "bg-amber-100 text-amber-800 font-black"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {isFirst
                            ? "Origin"
                            : isLast
                            ? "Destination"
                            : isTransfer
                            ? "Switch Here"
                            : "Transit Stop"}
                        </span>
                      </div>
                      {isTransfer && (
                        <p className="text-[9px] text-amber-700 font-bold mt-0.5">
                          ➜ Transfer to {secondBusName}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── FOOTER ACTIONS ── */}
        <div className="border-t border-slate-100 p-3 bg-slate-50/80 rounded-b-2xl flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectRoute(plan);
            }}
            className="flex-1 py-2.5 px-3.5 bg-[#2B4B9E] hover:bg-[#1e3570] text-white rounded-xl text-xs font-black shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Select Route & Track</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default TripPlanDetailPopover;