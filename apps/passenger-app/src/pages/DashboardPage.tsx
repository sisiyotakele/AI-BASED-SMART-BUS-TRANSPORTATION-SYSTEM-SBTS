// src/pages/DashboardPage.tsx
import React from "react";
import { Bus, Route, Clock } from "lucide-react";
import { PassengerLayout } from "../layouts/PassengerLayout";
import { LiveMapView } from "../features/trip-tracking/LiveMapView";
import { AiTrafficAndQuickActions } from "../features/dashboard/AiTrafficAndQuickActions";
import { TripPlannerCard } from "../features/route-search/TripPlannerCard";

export const DashboardPage: React.FC = () => {
  return (
    <PassengerLayout>
      <div className="space-y-6">
        
        {/* TOP CARD: ACTIVE JOURNEY SUMMARY (LIGHT MODE WHITE CARD) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Journey & Next Bus
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              On Schedule
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {/* Bus Info */}
            <div className="flex items-center gap-3 p-3 rounded-xl border bg-slate-50/80 border-slate-200/80">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <Bus className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-medium block uppercase tracking-wider text-slate-400">
                  Bus Assigned
                </span>
                <span className="font-bold text-xs sm:text-sm truncate block text-slate-900">
                  SBTS-BUS-114
                </span>
              </div>
            </div>

            {/* Route Info */}
            <div className="flex items-center gap-3 p-3 rounded-xl border bg-slate-50/80 border-slate-200/80">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                <Route className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-medium block uppercase tracking-wider text-slate-400">
                  Active Route
                </span>
                <span className="font-bold text-xs sm:text-sm truncate block text-slate-900">
                  Route 12 — Megenagna → Bole
                </span>
              </div>
            </div>

            {/* ETA Info */}
            <div className="flex items-center gap-3 p-3 rounded-xl border sm:col-span-2 md:col-span-1 bg-slate-50/80 border-slate-200/80">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-medium block uppercase tracking-wider text-slate-400">
                  Estimated Arrival
                </span>
                <span className="font-bold text-emerald-600 text-xs sm:text-sm truncate block">
                  07:24 AM (4 mins)
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* TRIP PLANNER CARD */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <TripPlannerCard />
        </div>

        {/* LIVE ROUTE MAP */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <LiveMapView />
        </div>

        {/* AI TRAFFIC & QUICK ACTIONS */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
          <AiTrafficAndQuickActions />
        </div>

      </div>
    </PassengerLayout>
  );
};

export default DashboardPage;