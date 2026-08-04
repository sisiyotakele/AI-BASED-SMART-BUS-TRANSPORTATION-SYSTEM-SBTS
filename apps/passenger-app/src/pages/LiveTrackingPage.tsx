// src/pages/LiveTrackingPage.tsx
import React, { useState } from "react";
import { PassengerLayout } from "../layouts/PassengerLayout";
import { LiveMapView } from "../features/trip-tracking/LiveMapView";
import { Bus, MapPin, Clock, ShieldCheck } from "lucide-react";

export const LiveTrackingPage: React.FC = () => {
  const [selectedRoute, setSelectedRoute] = useState("Route 12");

  return (
    <PassengerLayout pageTitle="Live Bus Tracking">
      {/* Route Selector Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Bus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Active Bus Fleet Tracking</h2>
            <p className="text-xs text-slate-500">Real-time GPS coordinates and route progress</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-slate-500">Select Route:</label>
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

      {/* Main Map Box */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <LiveMapView />
      </div>

      {/* Live Route Bus Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase">Bus ID & Model</span>
            <span className="text-sm font-extrabold text-slate-800 block">SBTS-BUS-114 (Anbessa Euro 5)</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase">Current Stop</span>
            <span className="text-sm font-extrabold text-slate-800 block">CMC Michael Station</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold uppercase">Next Stop Arrival</span>
            <span className="text-sm font-extrabold text-emerald-600 block">07:41 AM (~17 mins)</span>
          </div>
        </div>
      </div>
    </PassengerLayout>
  );
};

export default LiveTrackingPage;