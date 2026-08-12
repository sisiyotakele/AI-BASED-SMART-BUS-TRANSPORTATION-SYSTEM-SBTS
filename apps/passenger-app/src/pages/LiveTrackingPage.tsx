import React, { useState } from "react";
import { PassengerLayout } from "../layouts/PassengerLayout";
import { LiveMapView } from "../features/trip-tracking/LiveMapView";
import { StopFinderView } from "../features/trip-tracking/StopFinderView";
import { Bus, MapPin, Clock, ShieldCheck } from "lucide-react";

export const LiveTrackingPage: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState("Route 12");

  return (
    <PassengerLayout pageTitle="Live Bus Tracking">
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Route Selector Banner */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Active Bus Fleet Tracking</h2>
              <p className="text-xs text-slate-500">Real-time GPS coordinates, active route progress & station ETAs</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-500">Select Line:</label>
            <select
              value={selectedRoute}
              onChange={(e) => setSelectedRoute(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="Route 12">Route 12 (Megenagna → Bole)</option>
              <option value="Route 04">Route 04 (Tor Hailoch → Stadium)</option>
              <option value="Route 18">Route 18 (CMC → Mexico)</option>
            </select>
          </div>
        </div>

        {/* Live Interactive Map Box */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <LiveMapView />
        </div>

        {/* Live Route Bus Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-xs">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Bus ID & Model</span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-800 block truncate">SBTS-BUS-114 (Anbessa Euro 5)</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-xs">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Current Stop</span>
              <span className="text-xs sm:text-sm font-extrabold text-slate-800 block truncate">CMC Michael Station</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-xs">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Next Stop Arrival</span>
              <span className="text-xs sm:text-sm font-extrabold text-emerald-600 block truncate">07:41 AM (~17 mins)</span>
            </div>
          </div>
        </div>

        {/* Nearby Bus Stops & ETAs */}
        <div className="pt-4 border-t border-slate-200/80">
          <StopFinderView />
        </div>
      </div>
    </PassengerLayout>
  );
};

export default LiveTrackingPage;