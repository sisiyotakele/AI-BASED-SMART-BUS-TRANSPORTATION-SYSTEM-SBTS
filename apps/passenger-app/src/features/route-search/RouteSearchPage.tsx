import React from "react";
import { useRouteSearch } from "./useRouteSearch";
import { Search, MapPin, ArrowRight, ArrowLeft, Bus, Clock, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const RouteSearchPage: React.FC = () => {
  const { search, setSearch, filteredRoutes, isLoading, isRefreshing, refetch } = useRouteSearch();
  const navigate = useNavigate();

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button & Header Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/dashboard")}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 transition-colors font-semibold text-xs cursor-pointer shadow-2xs group"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500 group-hover:text-[#1B2A4A] transition-colors" />
          <span>Back to Main Page</span>
        </button>

        <button
          onClick={refetch}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
          title="Refresh Routes"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Find Bus Routes</h1>
        <p className="text-sm text-slate-500">Search origins, destinations, and check line availability across Addis Ababa.</p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-4 top-3.5 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Where are you going? (e.g. Bole, Megenagna, CMC)..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 transition-all shadow-xs"
        />
      </div>

      {/* Loading Indicator */}
      {isLoading ? (
        <div className="py-12 text-center text-slate-400 text-xs font-semibold animate-pulse">
          Loading route network from server...
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-2">
          <Bus className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-700 text-sm">No routes matched "{search}"</h4>
          <p className="text-xs text-slate-400">Try searching for a different terminal or corridor.</p>
        </div>
      ) : (
        /* Route Cards */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoutes.map((route) => (
            <div key={route.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-indigo-500 transition-all flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-lg">
                    {route.routeName}
                  </span>
                  <span className="text-slate-900 font-extrabold text-sm">{route.fareEtb} ETB</span>
                </div>

                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  <MapPin className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span className="truncate">{route.origin}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{route.destination}</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> ~{route.estimatedDurationMin} min</span>
                <span className="flex items-center gap-1"><Bus className="w-3.5 h-3.5 text-emerald-600" /> {route.activeBusesCount} buses active</span>
              </div>

              <button
                onClick={() => navigate(`/tracking?routeId=${route.id}`)}
                className="w-full py-2.5 bg-[#1B2A4A] hover:bg-indigo-600 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Track Live
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default RouteSearchPage;