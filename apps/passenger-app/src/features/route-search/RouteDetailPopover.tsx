import React, { useEffect } from "react";
import { X, Bus, GitMerge, Clock, MapPin, ArrowRight, Footprints, Navigation, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { RouteOption } from "./types";

interface RouteDetailPopoverProps {
  option: RouteOption;
  destinationName: string;
  onClose: () => void;
}

export const RouteDetailPopover: React.FC<RouteDetailPopoverProps> = ({
  option,
  destinationName,
  onClose,
}) => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleTrackLive = () => {
    onClose();
    navigate("/tracking");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs" />

      <div
        className="relative w-full sm:max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-t-3xl sm:rounded-2xl border border-slate-200 shadow-2xl z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle indicator */}
        <div className="sm:hidden w-12 h-1.5 bg-slate-300 rounded-full mx-auto my-2.5" />

        <div className="sticky top-0 bg-white/95 backdrop-blur-md border-b border-slate-100 px-6 py-5 flex items-start justify-between gap-3 z-10">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              {option.isMergedRoute ? (
                <span className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-xs sm:text-sm font-extrabold flex items-center gap-1.5" style={{ color: "#12B2E4" }}>
                  <GitMerge className="w-4 h-4" /> Multi-Leg Transfer
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-extrabold flex items-center gap-1.5">
                  <Bus className="w-4 h-4" /> Direct Route
                </span>
              )}
            </div>
            <h3 className="font-black text-slate-900 text-lg sm:text-xl leading-tight truncate">{option.busNumber}</h3>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 font-medium">{option.routeVia}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer shrink-0"
            aria-label="Close details"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Key Metric Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs sm:text-sm">
            {option.fare && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center sm:text-left">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-1">Fare</span>
                <span className="font-black text-base sm:text-lg" style={{ color: "#2B4B9E" }}>{option.fare}</span>
              </div>
            )}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center sm:text-left">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-1">Est. Trip Time</span>
              <span className="font-black text-slate-900 text-base sm:text-lg">~{option.totalTripMinutes} mins</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center sm:text-left">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-1">Next Bus ETA</span>
              <span className="font-black text-emerald-600 text-base sm:text-lg flex items-center justify-center sm:justify-start gap-1">
                <Clock className="w-4 h-4" /> in {option.busEtaMinutes}m
              </span>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center sm:text-left">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 block mb-1">Crowd Status</span>
              <span className="font-black text-slate-900 text-base sm:text-lg">{option.crowdLevel}</span>
            </div>
          </div>

          {/* Departure & Arrival Info Banner */}
          <div className="p-5 rounded-2xl bg-sky-50/70 border border-sky-100 text-xs sm:text-sm space-y-2.5">
            <div className="flex items-center gap-2.5 font-extrabold text-slate-900 text-sm sm:text-base">
              <MapPin className="w-5 h-5 shrink-0" style={{ color: "#2B4B9E" }} />
              <span>Boarding Station:</span>
              <span style={{ color: "#2B4B9E" }}>{option.nearestStation.name}</span>
            </div>
            <div className="flex items-center justify-between text-slate-700 font-medium pl-7">
              <span>Station Distance: {option.nearestStation.distanceMeters}m away</span>
              <span className="font-bold" style={{ color: "#2B4B9E" }}>~{option.nearestStation.walkTimeMinutes} min walk</span>
            </div>
            <div className="border-t border-sky-200/60 pt-2.5 flex items-center justify-between font-semibold text-slate-800 pl-7">
              <span>Destination:</span>
              <span className="font-black text-slate-900 text-sm sm:text-base">{destinationName}</span>
            </div>
          </div>

          {/* Leg Breakdown for Merged vs Direct */}
          {option.isMergedRoute && option.legs && option.legs.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-600">
                  Transfer Itinerary ({option.legs.length} Bus Legs)
                </h4>
                <span className="text-xs font-extrabold text-white px-3 py-1 rounded-full" style={{ backgroundColor: "#12B2E4" }}>
                  {option.transfersCount} Transfer Point
                </span>
              </div>

              <div className="space-y-3">
                {option.legs.map((leg, index) => (
                  <div key={leg.legIndex} className="space-y-3">
                    {index > 0 && (
                      <div className="px-4 py-2.5 rounded-xl bg-sky-50 border border-sky-200 text-xs sm:text-sm font-extrabold text-slate-900 flex items-center gap-2.5">
                        <Footprints className="w-4 h-4 shrink-0" style={{ color: "#12B2E4" }} />
                        <span>Transfer at <strong>{leg.fromStation}</strong> (~{leg.transferWaitMinutes || 4} min wait)</span>
                      </div>
                    )}
                    <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 text-xs sm:text-sm space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 font-extrabold text-slate-900">
                          <span className="w-7 h-7 rounded-full text-white text-xs flex items-center justify-center font-black" style={{ backgroundColor: "#2B4B9E" }}>
                            {leg.legIndex}
                          </span>
                          <span className="text-base font-extrabold">{leg.busNumber}</span>
                        </div>
                        {leg.fare && <span className="font-black text-base" style={{ color: "#2B4B9E" }}>{leg.fare}</span>}
                      </div>

                      <div className="flex items-center gap-2.5 text-slate-800 font-bold pl-9 text-sm">
                        <span>{leg.fromStation}</span>
                        <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>{leg.toStation}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-600 pl-9 pt-2 border-t border-slate-200/60 font-medium">
                        <span className="font-semibold">{leg.busType}</span>
                        <span>Estimated duration: ~{leg.durationMinutes} min</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h4 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-600">
                Route Stops
              </h4>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 max-h-48 overflow-y-auto space-y-2">
                {option.stops && option.stops.length > 0 ? option.stops.map((stopName, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-sm font-bold text-slate-700">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{stopName}</span>
                  </div>
                )) : (
                  <span className="text-sm text-slate-500 font-medium">No stops recorded for this route.</span>
                )}
              </div>
            </div>
          )}

          {/* Modal Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3.5 pt-3">
            <button
              type="button"
              onClick={handleTrackLive}
              className="w-full sm:w-1/2 py-3.5 text-white rounded-xl font-extrabold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:opacity-90"
              style={{ backgroundColor: "#2B4B9E" }}
            >
              <Navigation className="w-4 h-4 text-sky-200" />
              <span>Track Route Live</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-1/2 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-extrabold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              Close Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDetailPopover;

