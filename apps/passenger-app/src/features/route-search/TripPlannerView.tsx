import React, { useState } from "react";
import { Search, MapPin, ArrowRight, Bus, Clock, Compass } from "lucide-react";

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

  const handlePlanTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!origin || !destination) return;

    // Simulated trip recommendation search
    setResults([
      {
        id: "p1",
        routeName: "Route 101 Direct",
        originStop: `${origin} Stop`,
        destinationStop: `${destination} Terminal`,
        transfers: 0,
        totalTimeMin: 28,
        nextDepartureMin: 4,
      },
      {
        id: "p2",
        routeName: "Route 204 → Route 305",
        originStop: `${origin} Stop`,
        destinationStop: `${destination} Terminal`,
        transfers: 1,
        totalTimeMin: 35,
        nextDepartureMin: 2,
      },
    ]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Compass className="w-6 h-6 text-indigo-600" />
          Trip Planner
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Enter your origin and destination to get route recommendations and stop choices.
        </p>
      </div>

      {/* Step 10: Input Form */}
      <form onSubmit={handlePlanTrip} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Origin Stop or Location</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="e.g. Megenagna"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Destination Stop or Location</label>
            <div className="relative">
              <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Tor Hailoch"
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-xs sm:text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                required
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          <span>Search Suggested Routes & Stops</span>
        </button>
      </form>

      {/* Steps 11 & 12: Recommended Options */}
      {results && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-800">Suggested Routes & Connections</h2>

          <div className="space-y-3">
            {results.map((plan) => (
              <div
                key={plan.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-lg border border-indigo-200">
                      {plan.routeName}
                    </span>
                    <span className="text-xs text-slate-500">
                      {plan.transfers === 0 ? "Direct line" : `${plan.transfers} transfer required`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800">
                    <span>{plan.originStop}</span>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                    <span>{plan.destinationStop}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-0 pt-3 sm:pt-0 border-slate-100">
                  <div className="text-right">
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" /> ~{plan.totalTimeMin} mins
                    </div>
                    <div className="text-xs font-bold text-emerald-600 mt-0.5">
                      Bus arriving in {plan.nextDepartureMin} mins
                    </div>
                  </div>

                  <button className="px-4 py-2 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer">
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
