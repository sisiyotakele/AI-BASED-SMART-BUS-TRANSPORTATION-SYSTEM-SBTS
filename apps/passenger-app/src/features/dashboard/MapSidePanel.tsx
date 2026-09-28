// src/features/dashboard/MapSidePanel.tsx
// Google Maps–style side panel (desktop) / bottom sheet (mobile)
// Shows Home info, Route Search, and Trip History tabs
// overlaid on top of the full-screen map.

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  Home,
  Search,
  Clock,
  Bus,
  MapPin,
  Radio,
  LogIn,
  UserPlus,
  ShieldAlert,
  History,
  CheckCircle2,
  Calendar,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { AiTrafficAndQuickActions } from "./AiTrafficAndQuickActions";
import RouteSearchPage from "../route-search/RouteSearchPage";
import { tripsApi, BackendTrip } from "@/lib/api";
import { normalizeTripHistoryItem } from "@/lib/liveData";

// ─── Types ────────────────────────────────────────────────────────────────────
type PanelTab = "home" | "search" | "history";

interface HistoryItem {
  id: string;
  date: string;
  route: string;
  bus: string;
  fare: string;
  status: string;
}

// ─── History Panel ─────────────────────────────────────────────────────────────
const HistoryPanel: React.FC = () => {
  const navigate = useNavigate();
  const [tripHistory, setTripHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const isGuestMode = !localStorage.getItem("token");

  const fetchTrips = useCallback(async () => {
    if (isGuestMode) { setIsLoading(false); return; }
    setIsRefreshing(true);
    try {
      const res = await tripsApi.getTrips({ status: "completed" });
      if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
        const fetched: HistoryItem[] = res.data.data.map((t: BackendTrip) =>
          normalizeTripHistoryItem(t as unknown as Record<string, unknown>)
        );
        setTripHistory(fetched);
      } else {
        setTripHistory([]);
      }
    } catch {
      setTripHistory([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isGuestMode]);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  if (isGuestMode) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-4">
        <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center">
          <History className="w-6 h-6" />
        </div>
        <div>
          <h4 className="text-sm font-extrabold text-slate-900">No Trip History</h4>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Sign in to see your past journeys, fares, and boarding passes.
          </p>
        </div>
        <button
          onClick={() => navigate("/login")}
          className="px-5 py-2.5 bg-[#2B4B9E] text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer hover:opacity-90 transition-all"
        >
          Sign In to Track History
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="py-8 text-center text-slate-400 text-xs font-semibold animate-pulse">
        Loading trip history…
      </div>
    );
  }

  if (tripHistory.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500 text-xs font-semibold">
        No completed trips recorded yet.
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-bold text-slate-500">
          {tripHistory.length} trip{tripHistory.length !== 1 ? "s" : ""}
        </span>
        <button
          onClick={fetchTrips}
          disabled={isRefreshing}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
        </button>
      </div>
      <div className="divide-y divide-slate-100">
        {tripHistory.map((item) => (
          <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-full shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-slate-800 truncate">{item.route}</h4>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {item.date}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="w-3 h-3 shrink-0" /> {item.bus}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-xs font-black text-slate-800 block">{item.fare}</span>
              <span className="text-[10px] font-bold text-emerald-600">{item.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Home Panel ─────────────────────────────────────────────────────────────────
const HomePanel: React.FC = () => {
  const navigate = useNavigate();
  const { isGuest } = useAuth();

  return (
    <div className="space-y-4">
      {/* Guest mode banner */}
      {isGuest && (
        <div className="w-full bg-gradient-to-r from-blue-50 via-indigo-50/70 to-slate-50 border border-[#2B4B9E]/30 rounded-2xl p-4 shadow-xs flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl text-white shrink-0" style={{ backgroundColor: "#2B4B9E" }}>
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-xs text-slate-900">You're in Guest Mode</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-indigo-700 bg-indigo-100 border border-indigo-200">
                  Limited Access
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Log in to save routes, view full trip history, and unlock digital boarding passes!
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/login")}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer hover:opacity-90"
              style={{ backgroundColor: "#2B4B9E" }}
            >
              <LogIn className="w-3.5 h-3.5" />
              Log In
            </button>
            <button
              onClick={() => navigate("/register")}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-xs font-extrabold rounded-xl border transition-all cursor-pointer"
              style={{ color: "#2B4B9E", borderColor: "#2B4B9E" }}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Sign Up
            </button>
          </div>
        </div>
      )}

      {/* Live stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center gap-2.5 shadow-xs">
          <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: "#2B4B9E15" }}>
            <Bus className="w-4 h-4" style={{ color: "#2B4B9E" }} />
          </div>
          <div>
            <p className="text-base font-black text-slate-900 leading-none">14</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Active Fleet</p>
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center gap-2.5 shadow-xs">
          <div className="p-2 rounded-xl shrink-0" style={{ backgroundColor: "#2B4B9E15" }}>
            <MapPin className="w-4 h-4" style={{ color: "#2B4B9E" }} />
          </div>
          <div>
            <p className="text-base font-black text-slate-900 leading-none">13</p>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Stations Live</p>
          </div>
        </div>
      </div>

      {/* Live transit badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
          <Radio className="w-3 h-3 animate-pulse text-emerald-600" />
          Live Transit Active — Addis Ababa
        </span>
      </div>

      {/* AI traffic prediction */}
      <AiTrafficAndQuickActions />
    </div>
  );
};


// ─── MapSidePanel (Main Export) ────────────────────────────────────────────────
interface MapSidePanelProps {
  defaultTab?: PanelTab;
}

export const MapSidePanel: React.FC<MapSidePanelProps> = ({ defaultTab = "home" }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<PanelTab>(defaultTab);
  // Mobile: whether the sheet is expanded (true) or peeking (false)
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // If the user comes from a /trip?tab=stops link, auto-open Search tab
  useEffect(() => {
    if (location.search.includes("tab=stops") || location.search.includes("tab=search")) {
      setActiveTab("search");
      setMobileExpanded(true);
    }
  }, [location.search]);

  const tabs: { id: PanelTab; label: string; icon: React.ReactNode }[] = [
    { id: "home",    label: "Home",    icon: <Home className="w-4 h-4" /> },
    { id: "search",  label: "Search",  icon: <Search className="w-4 h-4" /> },
    { id: "history", label: "History", icon: <Clock className="w-4 h-4" /> },
  ];

  const handleTabClick = (tab: PanelTab) => {
    if (tab === activeTab) {
      // Toggle expansion on mobile
      setMobileExpanded((prev) => !prev);
    } else {
      setActiveTab(tab);
      setMobileExpanded(true);
    }
    // Scroll panel content to top on tab switch
    if (contentRef.current) contentRef.current.scrollTop = 0;
  };

  // ── Desktop: left sidebar panel ─────────────────────────────────────────────
  const DesktopPanel = (
    <aside className="hidden md:flex flex-col w-[380px] lg:w-[420px] h-full bg-[#F8FAFC] border-r border-slate-200/80 shadow-md z-10 flex-shrink-0">
      {/* Tab bar */}
      <div className="flex items-center gap-1 p-3 bg-white border-b border-slate-200/80 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-[#2B4B9E] text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Scrollable content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === "home"    && <HomePanel />}
        {activeTab === "search"  && <RouteSearchPage />}
        {activeTab === "history" && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Trip History</h3>
                <p className="text-xs text-slate-400">Past journeys &amp; fares</p>
              </div>
            </div>
            <HistoryPanel />
          </div>
        )}
      </div>
    </aside>
  );

  // ── Mobile: bottom sheet ─────────────────────────────────────────────────────
  const MobileSheet = (
    <div
      className={`md:hidden fixed bottom-0 left-0 right-0 z-30 flex flex-col bg-white rounded-t-3xl shadow-2xl border-t border-slate-200/80 transition-all duration-300 ease-in-out ${
        mobileExpanded ? "h-[72vh]" : "h-auto"
      }`}
    >
      {/* Drag handle */}
      <div
        className="flex flex-col items-center pt-2 pb-1 cursor-pointer select-none"
        onClick={() => setMobileExpanded((prev) => !prev)}
      >
        <div className="w-10 h-1 rounded-full bg-slate-300 mb-1" />
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 pb-2 shrink-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? "bg-[#2B4B9E] text-white shadow-sm"
                : "text-slate-500 bg-slate-50 hover:bg-slate-100"
            }`}
          >
            {tab.icon}
            <span className="truncate">{tab.label}</span>
          </button>
        ))}
        {mobileExpanded && (
          <button
            onClick={() => setMobileExpanded(false)}
            className="p-2 text-slate-400 hover:text-slate-700 transition-colors ml-1 cursor-pointer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Sheet content — only visible when expanded */}
      {mobileExpanded && (
        <div ref={contentRef} className="flex-1 overflow-y-auto px-4 pb-6 pt-1">
          {activeTab === "home"    && <HomePanel />}
          {activeTab === "search"  && <RouteSearchPage />}
          {activeTab === "history" && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Trip History</h3>
                  <p className="text-xs text-slate-400">Past journeys &amp; fares</p>
                </div>
              </div>
              <HistoryPanel />
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <>
      {DesktopPanel}
      {MobileSheet}
    </>
  );
};

export default MapSidePanel;
