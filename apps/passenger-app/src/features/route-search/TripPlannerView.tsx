import React, { useState } from "react";
import { Search, MapPin, ArrowRight, Clock, Compass, RefreshCw, Info, Navigation, Loader2, Footprints } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { routesApi } from "@/lib/api";
import { PlaceAutocomplete, AutocompleteItem } from "@/components/PlaceAutocomplete";
import { TripPlanDetailPopover } from "@/components/TripPlanDetailPopover";

interface TripPlan {
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
  legs?: any[];
  nearestStation?: any;
}

export const TripPlannerView: React.FC = () => {
  const navigate = useNavigate();
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [results, setResults] = useState<TripPlan[] | null>(null);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [detailedPlan, setDetailedPlan] = useState<TripPlan | null>(null);
  const [isPlanning, setIsPlanning] = useState<boolean>(false);

  const handleSelectOrigin = (item: AutocompleteItem) => {
    if (item.type === "route" && item.startStop && item.endStop) {
      setOrigin(item.startStop);
      setDestination(item.endStop);
    }
  };

  const handleSelectDest = (item: AutocompleteItem) => {
    if (item.type === "route" && item.startStop && item.endStop) {
      if (!origin) setOrigin(item.startStop);
      setDestination(item.endStop);
    }
  };

  const handleSelectRoute = (plan: TripPlan) => {
    setSelectedRouteId(plan.id);
    navigate("/dashboard#live-route-map", {
      state: {
        selectedRoute: {
          id: plan.id,
          busNumber: plan.routeName,
          routeVia: `${plan.originStop} → ${plan.destinationStop}`,
          totalTripMinutes: plan.totalTimeMin,
          fare: plan.fare || "15.00 ETB",
          nearestStation: { name: plan.originStop, walkTimeMinutes: 3 },
          isMergedRoute: plan.isMergedRoute,
          legs: plan.legs,
        },
        origin: plan.originStop,
        destination: plan.destinationStop,
        viaStops: plan.viaStops || [plan.originStop, plan.destinationStop],
      },
    });
  };

  const handlePlanTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;

    setIsPlanning(true);
    try {
      // 1. Query routes from backend plan endpoint
      const res = await routesApi.planRoute(origin, destination);
      let matchedPlans: TripPlan[] = [];

      if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
        matchedPlans = res.data.data.map((r: any, idx: number) => {
          const via = String(r.routeVia || "").split(" → ").map((s: string) => s.trim()).filter(Boolean);
          const legs = Array.isArray(r.legs) ? r.legs : undefined;
          const transfers = Number(r.transfersCount || (legs && legs.length > 1 ? legs.length - 1 : 0));
          const isMerged = Boolean(r.isMergedRoute || transfers > 0);

          return {
            id: String(r.id || `p-${idx}`),
            routeName: String(r.routeName || r.busNumber || r.routeCode || r.name || `Bus Line ${101 + idx}`),
            originStop: String((r.nearestStation as { name?: string })?.name || origin),
            destinationStop: String(destination),
            transfers,
            isMergedRoute: isMerged,
            totalTimeMin: Number(r.totalTripMinutes || 25),
            nextDepartureMin: Number(r.busEtaMinutes || 4),
            fare: String(r.fare || "15.00 ETB"),
            walkingMinutes: Number((r.nearestStation as { walkTimeMinutes?: number })?.walkTimeMinutes || 3),
            nearestStation: r.nearestStation,
            viaStops: via.length > 0 ? via : [origin, destination],
            legs,
          };
        });
      }

      const uniquePlans = matchedPlans.filter((plan, index, self) =>
        index === self.findIndex((p) => p.routeName === plan.routeName)
      );
      setResults(uniquePlans);
    } catch (err) {
      console.warn("Could not query backend routes plan:", err);
      setResults([]);
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Compass className="w-6 h-6 text-indigo-600" />
              Addis Transit Trip Planner
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Search live Sheger bus lines, stop-to-stop itineraries, and transfer schedules.
            </p>
          </div>
        </div>

        <form onSubmit={handlePlanTrip} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-extrabold text-slate-700 uppercase mb-1.5">Origin Stop or Location</label>
              <PlaceAutocomplete
                value={origin}
                onChange={setOrigin}
                onSelect={handleSelectOrigin}
                placeholder="e.g. Megenagna Hub, Akaki Terminal"
                required
                icon={<MapPin className="w-5 h-5 text-slate-400" />}
              />
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-extrabold text-slate-700 uppercase mb-1.5">Destination Stop or Location</label>
              <PlaceAutocomplete
                value={destination}
                onChange={setDestination}
                onSelect={handleSelectDest}
                placeholder="e.g. Bole, Mexico Square, Tor Hailoch"
                required
                icon={<MapPin className="w-5 h-5 text-slate-400" />}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isPlanning || !origin || !destination}
            className="w-full md:w-auto flex items-center justify-center gap-2 text-white text-sm font-extrabold px-8 py-3 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 hover:opacity-90"
            style={{ backgroundColor: "#2B4B9E" }}
          >
          {isPlanning ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Searching Routes...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Search Suggested Routes & Stops</span>
            </>
          )}
        </button>
      </form>
      </div>

      {/* Recommended Options */}
      {results && (
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-black text-slate-900">Suggested Routes & Connections</h2>

          <div className="space-y-4">
            {results.map((plan) => {
              const isSelected = selectedRouteId === plan.id;
              const isDirect = !plan.isMergedRoute && plan.transfers === 0;

              return (
                <div
                  key={plan.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                    isSelected
                      ? "border-[#2B4B9E] ring-2 ring-[#2B4B9E]/20"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-50 text-[#2B4B9E] text-xs font-black px-2.5 py-1 rounded-lg border border-indigo-100">
                        {plan.routeName}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          isDirect
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-sky-50 text-sky-700 border border-sky-200"
                        }`}
                      >
                        {isDirect ? "Direct Line" : `${plan.transfers} transfer required`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900">
                      <span>{plan.originStop}</span>
                      <ArrowRight className="w-4 h-4 text-slate-400" />
                      <span>{plan.destinationStop}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-0 pt-3 sm:pt-0 border-slate-100">
                    <div className="text-right">
                      <div className="text-xs text-slate-600 font-semibold flex items-center gap-1 justify-end">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> ~{plan.totalTimeMin} mins
                      </div>
                      <div className="text-xs font-black text-emerald-600 mt-0.5">
                        Bus in {plan.nextDepartureMin} mins
                      </div>
                      <div className="text-[11px] font-bold text-slate-500 mt-0.5 flex items-center gap-1 justify-end">
                        <Footprints className="w-3 h-3 text-amber-600" /> ~{plan.walkingMinutes || 3}m walk
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDetailedPlan(plan)}
                        className="px-3.5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                      >
                        <Info className="w-3.5 h-3.5 text-[#2B4B9E]" />
                        <span>Detail</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSelectRoute(plan)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 text-white shadow-xs ${
                          isSelected
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : "bg-[#2B4B9E] hover:bg-[#1e3570]"
                        }`}
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>{isSelected ? "Selected ✓" : "Select Route"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Popover modal */}
      {detailedPlan && (
        <TripPlanDetailPopover
          plan={detailedPlan}
          isOpen={Boolean(detailedPlan)}
          onClose={() => setDetailedPlan(null)}
          onSelectRoute={(p) => {
            setDetailedPlan(null);
            handleSelectRoute(p as TripPlan);
          }}
        />
      )}
    </div>
  );
};

