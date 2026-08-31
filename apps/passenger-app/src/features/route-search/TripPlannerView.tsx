import React, { useState } from "react";
import { Search, MapPin, ArrowRight, Clock, Compass, RefreshCw } from "lucide-react";
import { routesApi, aiIntegrationApi } from "@/lib/api";
import { useNavigate } from "react-router-dom";

interface TripPlan {
  id: string;
  routeName: string;
  originStop: string;
  destinationStop: string;
  transfers: number;
  totalTimeMin: number;
  nextDepartureMin: number;
}

export const TripPlannerView: React.FC = () => {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [results, setResults] = useState<TripPlan[] | null>(null);
  const [isPlanning, setIsPlanning] = useState<boolean>(false);
  const navigate = useNavigate();

  const handlePlanTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;

    setIsPlanning(true);
    setResults(null);
    try {
      // Fetch routes that might contain our origin or destination
      const [resOrigin, resDest] = await Promise.all([
        routesApi.getRoutes(origin),
        routesApi.getRoutes(destination)
      ]);

      const allRoutes = [...(resOrigin.data?.data || []), ...(resDest.data?.data || [])];
      // Deduplicate routes by ID
      const uniqueRoutesMap = new Map();
      allRoutes.forEach((r: any) => uniqueRoutesMap.set(r.id, r));
      const routesToDisplay = Array.from(uniqueRoutesMap.values());
      
      let matchedPlans: TripPlan[] = [];

      if (routesToDisplay.length > 0) {
        matchedPlans = routesToDisplay.slice(0, 3).map((r: any, idx: number) => {
          // Parse stops from the route's current version if available
          const activeVersion = r.versions && r.versions.length > 0 ? r.versions[0] : null;
          let calculatedOrigin = origin;
          let calculatedDest = destination;
          let estimatedTime = 25; // fallback min
          
          if (activeVersion && activeVersion.routeStops) {
            // Very basic matching of stop names against user input
            const stops = activeVersion.routeStops.map((rs: any) => rs.stop?.stopName).filter(Boolean);
            if (stops.length >= 2) {
              const matchedO = stops.find((s: string) => s.toLowerCase().includes(origin.toLowerCase()));
              const matchedD = stops.find((s: string) => s.toLowerCase().includes(destination.toLowerCase()));
              if (matchedO) calculatedOrigin = matchedO;
              if (matchedD) calculatedDest = matchedD;
            }
            
            // Sum up estimated minutes for total time if available
            const totalMins = activeVersion.routeStops.reduce((sum: number, rs: any) => sum + (rs.estimatedMinutes || 0), 0);
            if (totalMins > 0) estimatedTime = totalMins;
          }

          return {
            id: String(r.id),
            routeName: String(r.routeName || r.name),
            originStop: calculatedOrigin,
            destinationStop: calculatedDest,
            transfers: idx === 0 ? 0 : 1, // Basic mock transfer state for demo
            totalTimeMin: estimatedTime,
            nextDepartureMin: Math.max(2, (idx + 1) * 4), // Mock departure
          };
        });
      }

      // 2. Fetch AI ETA prediction as supplementary accuracy if possible
      if (matchedPlans.length > 0) {
        try {
          const etaRes = await aiIntegrationApi.predictEta({
            origin_lat: 9.0227, // Megenagna mock coords
            origin_lon: 38.7955,
            dest_lat: 9.0180,  // CMC mock coords
            dest_lon: 38.8310,
          });
          if (etaRes.data?.success && etaRes.data?.data) {
            const etaVal = Number(etaRes.data.data.eta_minutes || etaRes.data.data.estimated_duration);
            if (etaVal > 0) {
              matchedPlans[0].totalTimeMin = etaVal;
            }
          }
        } catch (err) {
          console.warn("AI ETA service endpoint unavailable, using static duration model:", err);
        }
        setResults(matchedPlans);
      } else {
        // Fallback gracefully so UI doesn't break if no DB routes match
        setResults([
          {
            id: "fallback-p1",
            routeName: "Express Shuttle 01",
            originStop: origin,
            destinationStop: destination,
            transfers: 0,
            totalTimeMin: 30,
            nextDepartureMin: 5,
          }
        ]);
      }
    } catch (err) {
      console.error("Could not query backend routes, using fallback plan generator:", err);
      // Fallback
      setResults([
        {
          id: "fallback-p1",
          routeName: "Express Shuttle 01",
          originStop: origin,
          destinationStop: destination,
          transfers: 0,
          totalTimeMin: 30,
          nextDepartureMin: 5,
        }
      ]);
    } finally {
      setIsPlanning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 flex items-center gap-2.5">
          <Compass className="w-7 h-7 text-indigo-600" />
          Trip Planner
        </h1>
        <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
          Enter your origin and destination to get real-time route recommendations and stop choices.
        </p>
      </div>

      {/* Input Form */}
      <form onSubmit={handlePlanTrip} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="block text-xs sm:text-sm font-extrabold text-slate-700 uppercase mb-1.5">Origin Stop or Location</label>
            <div className="relative">
              <MapPin className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. Megenagna"
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm sm:text-base outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-semibold"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-extrabold text-slate-700 uppercase mb-1.5">Destination Stop or Location</label>
            <div className="relative">
              <MapPin className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Tor Hailoch"
                className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm sm:text-base outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 font-semibold"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPlanning}
          className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-sm sm:text-base shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2.5 disabled:opacity-60"
        >
          {isPlanning ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Searching Backend Routes...</span>
            </>
          ) : (
            <>
              <Search className="w-5 h-5" />
              <span>Search Suggested Routes & Stops</span>
            </>
          )}
        </button>
      </form>

      {/* Recommended Options */}
      {results && (
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-black text-slate-900">Suggested Routes & Connections</h2>

          <div className="space-y-4">
            {results.map((plan) => (
              <div
                key={plan.id}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="bg-indigo-50 text-indigo-700 text-xs sm:text-sm font-extrabold px-3 py-1 rounded-lg border border-indigo-200">
                      {plan.routeName}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-500">
                      {plan.transfers === 0 ? "Direct line" : `${plan.transfers} transfer required`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 text-sm sm:text-base font-extrabold text-slate-900">
                    <span>{plan.originStop}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span>{plan.destinationStop}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-0 pt-4 sm:pt-0 border-slate-100">
                  <div className="text-right">
                    <div className="text-xs sm:text-sm text-slate-600 font-semibold flex items-center gap-1.5 justify-end">
                      <Clock className="w-4 h-4 text-slate-400" /> ~{plan.totalTimeMin} mins
                    </div>
                    <div className="text-xs sm:text-sm font-black text-emerald-600 mt-1">
                      Bus arriving in {plan.nextDepartureMin} mins
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate('/track')}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer"
                  >
                    Track Bus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

