import React from "react";
import { Navigation, MapPin, Clock, ArrowRight, Bus, Radio, LogIn, UserPlus, ShieldAlert } from "lucide-react";
import { PassengerLayout } from "../layouts/PassengerLayout";
import { LiveMapView } from "../features/trip-tracking/LiveMapView";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { isGuest } = useAuth();

  return (
    <PassengerLayout>
      <div className="w-full space-y-6">

        {/* ── UPFRONT GUEST MODE SUGGESTION SECTION ──────────────── */}
        {isGuest && (
          <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50/70 to-slate-50 border border-[#2B4B9E]/30 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-200">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2.5 rounded-xl text-white shrink-0 shadow-xs" style={{ backgroundColor: "#2B4B9E" }}>
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    You're in Guest Mode
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-indigo-700 bg-indigo-100 border border-indigo-200">
                    Limited Access
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  Log in or sign up to save your favorite bus routes, view full trip history, and unlock digital boarding passes!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2.5 shrink-0 pt-1 sm:pt-0">
              <button
                onClick={() => navigate("/login")}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer hover:opacity-90"
                style={{ backgroundColor: "#2B4B9E" }}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </button>
              <button
                onClick={() => navigate("/register")}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-xs font-extrabold rounded-xl border transition-all cursor-pointer"
                style={{ color: "#2B4B9E", borderColor: "#2B4B9E" }}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
            </div>
          </div>
        )}

        {/* ── HERO QUICK-ACCESS CARD ("Where are you going" section - WHITE COLOR) ── */}
        <div className="w-full rounded-3xl overflow-hidden shadow-md border border-slate-200/90 bg-white">
          {/* Top text section */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                <Radio className="w-3 h-3 animate-pulse text-emerald-600" />
                Live Transit Active
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-2 leading-tight">
              Where are you going<br className="sm:hidden" /> today?
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 font-medium">
              Plan a trip or find live bus stop ETAs across Addis Ababa
            </p>
          </div>

          {/* Two action buttons - using #2B4B9E */}
          <div className="px-6 pb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Plan a Trip */}
            <button
              onClick={() => navigate("/trip")}
              className="group flex items-center gap-4 text-white rounded-2xl p-4 text-left transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md hover:opacity-95"
              style={{ backgroundColor: "#2B4B9E" }}
            >
              <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0 transition-all">
                <Navigation className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-white">Plan a Trip</p>
                <p className="text-[11px] text-blue-100 mt-0.5">Origin → Destination routes</p>
              </div>
              <ArrowRight className="w-4 h-4 text-blue-100 group-hover:translate-x-1 transition-transform shrink-0" />
            </button>

            {/* Find Bus Stops */}
            <button
              onClick={() => navigate("/trip")}
              className="group flex items-center gap-4 bg-slate-50 hover:bg-slate-100 border rounded-2xl p-4 text-left transition-all duration-200 cursor-pointer shadow-2xs"
              style={{ borderColor: "#2B4B9E40" }}
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all" style={{ backgroundColor: "#2B4B9E15" }}>
                <MapPin className="w-5 h-5" style={{ color: "#2B4B9E" }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-extrabold text-slate-900">Find Bus Stops</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Live ETAs near your location</p>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform shrink-0" style={{ color: "#2B4B9E" }} />
            </button>
          </div>

          {/* Bottom stats strip */}
          <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-3 flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <Bus className="w-4 h-4" style={{ color: "#2B4B9E" }} />
              <span className="text-[11px] text-slate-600 font-medium">
                <span className="text-slate-900 font-bold">142</span> buses active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" style={{ color: "#2B4B9E" }} />
              <span className="text-[11px] text-slate-600 font-medium">
                <span className="text-slate-900 font-bold">38</span> stops online
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              <span className="text-[11px] text-slate-500 font-medium">Updated just now</span>
            </div>
          </div>
        </div>

        {/* ── LIVE ROUTE MAP ──────────────────────────────────────── */}
        <div
          id="live-route-map"
          className="w-full bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs scroll-mt-6"
        >
          <LiveMapView />
        </div>

      </div>
    </PassengerLayout>
  );
};

export default DashboardPage;