// src/layouts/PassengerLayout.tsx
import React, { useState, useRef, useEffect } from "react";
import { 
  Bell, 
  History, 
  Home,
  X,
  Clock,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Info,
  User,
  Globe,
  Search
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ProfileModal from "../features/profile/ProfileModal"; 
import { useAuth } from "../features/auth/AuthContext";
import shegerlogo from "../assets/sheger-logo.jpg";
import { notificationsApi, tripsApi, BackendTrip } from "@/lib/api";
import { normalizeNotificationFromBackend, normalizeTripHistoryItem } from "@/lib/liveData";
import { getStoredProximityAlerts, ProximityAlert } from "@/lib/proximityAlerts";
import { subscribeToNotifications } from "@/lib/socket";

interface LayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
  /** When true: removes main content padding and overflow so the map fills the full viewport */
  mapMode?: boolean;
}

type HeaderNotification = { id:string; title:string; message:string; time:string; type:"warning"|"info"|"success"|"alert"; unread:boolean; isProximity?: boolean };
type HeaderTripHistory = { id: string; date: string; from: string; to: string; busNumber: string; fare: string; status: string };

export const PassengerLayout: React.FC<LayoutProps> = ({ children, mapMode }) => {
  const { user, isGuest, logout: authLogout } = useAuth();
  const location = useLocation();

  // Popover States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [headerNotifications, setHeaderNotifications] = useState<HeaderNotification[]>([]);
  const [headerHistory, setHeaderHistory] = useState<HeaderTripHistory[]>([]);
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = headerSearchQuery.trim();
    if (!query) return;

    if (location.pathname !== "/dashboard") {
      navigate("/dashboard");
    }

    // Broadcast search query to CollapsibleSidePanel and LiveMapView to instantly track/plan
    window.dispatchEvent(
      new CustomEvent("sbts:select_route", {
        detail: {
          selectedRoute: {
            id: "route-search-" + Date.now(),
            busNumber: `Route (${query})`,
            routeVia: `Central Hub → ${query}`,
            totalTripMinutes: 24,
            fare: "15.00 ETB",
            nearestStation: { name: "Central Station", walkTimeMinutes: 3 },
          },
          origin: "Megenagna Hub",
          destination: query,
          viaStops: ["Corridor Station", query],
        },
      })
    );
  };

  // Derive user profile from AuthContext (GET /auth/me) or Guest fallback
  const userProfile = {
    name: user?.fullName || (isGuest ? "Guest Commuter" : "Passenger"),
    email: user?.email || (isGuest ? "guest@shegerbus.et" : "passenger@shegerbus.et"),
    phone: user?.phone || (isGuest ? "N/A (Guest Session)" : "+251..."),
    avatar: "",
    passengerId: user?.id ? `PAS-${user.id.slice(0, 6)}` : (isGuest ? "GUEST-PASSER" : "PAS-9821")
  };

  const navigate = useNavigate();
  const historyRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHeaderNotifications([]);
    setHeaderHistory([]);

    const loadHeaderData = async () => {
      if (isGuest) return;

      const storedProximity = getStoredProximityAlerts().slice(0, 4).map((p: ProximityAlert) => ({
        id: p.id,
        title: p.title,
        message: p.message,
        time: p.time || "Recently",
        type: p.type,
        unread: !p.read,
        isProximity: true,
      }));

      try {
        const [notifRes, tripsRes] = await Promise.all([
          notificationsApi.getNotifications({ limit: 5 }),
          tripsApi.getTrips({ status: "completed" }),
        ]);

        let apiNotifs: HeaderNotification[] = [];
        if (notifRes.data?.success && Array.isArray(notifRes.data?.data) && notifRes.data.data.length > 0) {
          const items = notifRes.data.data.map((entry: Record<string, unknown>) => normalizeNotificationFromBackend(entry));
          apiNotifs = items.map((item: { id: string; title: string; message: string; time: string; type: "warning" | "info" | "success" | "alert"; read: boolean }) => ({
            id: item.id,
            title: item.title,
            message: item.message,
            time: item.time,
            type: item.type,
            unread: !item.read,
          }));
        }

        const combinedNotifs = [...storedProximity, ...apiNotifs];
        setHeaderNotifications(combinedNotifs);

        if (tripsRes.data?.success && Array.isArray(tripsRes.data?.data) && tripsRes.data.data.length > 0) {
          const items = tripsRes.data.data.slice(0, 5).map((trip: BackendTrip) => normalizeTripHistoryItem(trip as unknown as Record<string, unknown>));
          setHeaderHistory(items.map((item: { id: string; date: string; route: string; bus: string; fare: string; status: string }) => {
            const segments = item.route.split("→").map((s: string) => s.trim());
            return {
              id: item.id,
              date: item.date,
              from: segments[0] || "Origin",
              to: segments[1] || "Destination",
              busNumber: item.bus,
              fare: item.fare,
              status: item.status,
            };
          }));
        } else {
          setHeaderHistory([]);
        }
      } catch {
        setHeaderNotifications(storedProximity);
        setHeaderHistory([]);
      }
    };

    loadHeaderData();

    // Listen for WebSocket notifications live
    const unsubscribeSocket = isGuest ? () => undefined : subscribeToNotifications((evt) => {
      if (evt && evt.message) {
        const isProx = evt.title?.toLowerCase().includes("approaching") || evt.type === "alert";
        const newItem: HeaderNotification = {
          id: `ws-hdr-${Date.now()}`,
          title: evt.title || (isProx ? "Station Arrival Alert" : "Transit Alert"),
          message: evt.message,
          time: "Just now",
          type: evt.type === "warning" ? "warning" : evt.type === "alert" ? "alert" : "info",
          unread: true,
          isProximity: isProx,
        };
        setHeaderNotifications((prev) => [newItem, ...prev]);
      }
    });

    // Listen for custom proximity alert events
    const handleProximityEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ProximityAlert>;
      if (customEvent.detail) {
        const prox = customEvent.detail;
        const newItem: HeaderNotification = {
          id: prox.id,
          title: prox.title,
          message: prox.message,
          time: "Just now",
          type: prox.type,
          unread: true,
          isProximity: true,
        };
        setHeaderNotifications((prev) => [newItem, ...prev.filter((n) => n.id !== newItem.id)]);
      }
    };

    window.addEventListener("sbts:new_notification", handleProximityEvent);

    return () => {
      unsubscribeSocket();
      window.removeEventListener("sbts:new_notification", handleProximityEvent);
    };
  }, [isGuest]);

  const unreadCount = headerNotifications.filter((n) => n.unread).length;

  // Handle outside click to close popouts
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setIsHistoryOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await authLogout();
    sessionStorage.clear();
    navigate("/login", { replace: true });
  };

  return (
    <div className={`font-sans text-slate-800 selection:bg-indigo-500 selection:text-white ${mapMode ? "h-screen overflow-hidden flex flex-col" : "min-h-screen flex flex-col bg-[#F8FAFC]"}`}>
      
      {/* HEADER BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-8 py-3.5 flex items-center justify-between gap-2 shadow-2xs">
        
        {/* LEFT SIDE: Sheger Bus Brand -> Links to Landing Page */}
        <Link to="/" className="flex items-center gap-2 shrink-0 group" title="Return to Landing Page">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-50 p-0.5 border border-slate-200 shadow-xs flex items-center justify-center shrink-0 overflow-hidden group-hover:scale-105 transition-transform">
            <img 
              src={shegerlogo}
              alt="Sheger Bus Logo" 
              className="w-full h-full object-cover rounded-lg" 
            />
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base leading-none tracking-tight text-slate-900 group-hover:text-sky-600 transition-colors">
              Sheger Bus
            </h1>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium mt-0.5">
              Transit System
            </p>
          </div>
        </Link>

        {/* ── CENTER: DESKTOP HEADER SEARCH BAR (with Button & Enter) ── */}
        <form 
          onSubmit={handleHeaderSearch}
          className="hidden md:flex items-center flex-1 max-w-md mx-4 relative"
        >
          <div className="relative w-full flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              value={headerSearchQuery}
              onChange={(e) => setHeaderSearchQuery(e.target.value)}
              placeholder="Search bus stops, routes, destinations… (Press Enter)"
              className="w-full pl-9 pr-20 py-2 bg-slate-100/90 hover:bg-slate-100 focus:bg-white rounded-2xl text-xs font-semibold text-slate-900 border border-slate-200/80 focus:border-[#2B4B9E] focus:ring-2 focus:ring-[#2B4B9E]/10 outline-none transition-all placeholder:text-slate-400 shadow-2xs"
            />
            <button
              type="submit"
              className="absolute right-1.5 px-2.5 py-1 bg-[#2B4B9E] hover:bg-[#1e3570] text-white text-[11px] font-extrabold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
            >
              <span>Search</span>
              <span className="text-[9px] opacity-70">⏎</span>
            </button>
          </div>
        </form>

        {/* RIGHT SIDE: Desktop Nav (Home, Trip, Explore) + History + Notifications + Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          
          {/* DESKTOP NAVIGATION LINKS: Home, Explore */}
          <div className="hidden md:flex items-center gap-2">
            <Link 
              to="/dashboard" 
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                location.pathname === "/dashboard"
                  ? "bg-[#2B4B9E] text-white border-[#2B4B9E]"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>

            {/* Trip button removed — trip planning is now in the collapsible sidebar on /dashboard */}

            <Link 
              to="/" 
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                location.pathname === "/"
                  ? "bg-[#2B4B9E] text-white border-[#2B4B9E]"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80"
              }`}
            >
              <Globe className="w-4 h-4 text-sky-500" />
              <span>Explore</span>
            </Link>
          </div>

          {/* HISTORY POPOUT */}
          {!isGuest && <div className="relative" ref={historyRef}>
            <button
              type="button"
              onClick={() => {
                setIsHistoryOpen(!isHistoryOpen);
                setIsNotificationsOpen(false);
              }}
              className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl border border-slate-200/80 transition-colors cursor-pointer flex items-center justify-center"
              title="Trip History"
            >
              <History className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
            </button>

            {isHistoryOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 text-slate-800 text-sm animate-in fade-in duration-150">
                <div className="bg-slate-50 p-4 flex items-center justify-between border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Recent Trip History</h3>
                      <p className="text-[11px] text-slate-400">Past rides & digital passes</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsHistoryOpen(false)}
                    className="p-1 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
                  {headerHistory.length === 0 ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium">
                      No completed trip history returned by backend.
                    </div>
                  ) : (
                    headerHistory.map((trip) => (
                      <div
                        key={trip.id}
                        className="p-3 bg-slate-50/80 hover:bg-slate-100 border border-slate-200/70 rounded-xl transition-colors space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400 text-[11px] font-medium">{trip.date}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {trip.status}
                          </span>
                        </div>

                        <div className="flex items-center justify-between font-bold text-slate-900 text-xs">
                          <span>{trip.busNumber}</span>
                          <span className="text-indigo-600 font-extrabold">{trip.fare}</span>
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                          <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                          <span className="truncate">{trip.from}</span>
                          <span>→</span>
                          <span className="truncate">{trip.to}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-200">
                  <Link
                    to="/history"
                    onClick={() => setIsHistoryOpen(false)}
                    className="block w-full py-2 px-3 bg-white hover:bg-slate-100 border border-slate-200 text-center text-xs font-extrabold text-slate-800 rounded-xl transition-colors shadow-2xs"
                  >
                    View Full Travel History →
                  </Link>
                </div>
              </div>
            )}
          </div>}

          {/* NOTIFICATIONS POPOUT */}
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsHistoryOpen(false);
              }}
              className="p-2 sm:p-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl border border-slate-200/80 transition-colors cursor-pointer flex items-center justify-center relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-slate-700" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              )}
            </button>

            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 text-slate-800 text-sm animate-in fade-in duration-150">
                <div className="bg-slate-50 p-4 flex items-center justify-between border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Notifications & Alerts</h3>
                      <p className="text-[11px] text-slate-400">Transit updates & schedule alerts</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsNotificationsOpen(false)}
                    className="p-1 hover:bg-slate-200/60 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
                  {headerNotifications.length === 0 ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 font-medium">
                      No notifications returned by backend.
                    </div>
                  ) : (
                    headerNotifications.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border transition-colors ${
                          item.isProximity
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : item.unread
                            ? "bg-slate-50 border-slate-200"
                            : "bg-white border-slate-100 opacity-80"
                        }`}
                      >
                        {item.isProximity ? (
                          <div className="flex items-center justify-between gap-2 text-xs font-extrabold">
                            <span className="flex items-center gap-1.5 min-w-0 truncate">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">Approaching {item.title.replace(/^.*?→\s*/, "")}</span>
                            </span>
                            <span className="shrink-0 text-emerald-700">{item.time}</span>
                          </div>
                        ) : <>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-900 flex items-center gap-1.5">
                            {item.isProximity ? (
                              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            ) : item.type === "warning" ? (
                              <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#12B2E4" }} />
                            ) : item.type === "alert" ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                            ) : item.type === "info" ? (
                              <Info className="w-3.5 h-3.5 text-indigo-500" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            )}
                            {item.title}
                          </span>
                          <span className="text-slate-400 text-[10px] font-medium">{item.time}</span>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {item.message}
                        </p>
                        </>}
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-200">
                  <Link
                    to="/notifications"
                    onClick={() => setIsNotificationsOpen(false)}
                    className="block w-full py-2 px-3 bg-[#2B4B9E] hover:opacity-95 text-center text-xs font-extrabold text-white rounded-xl transition-all shadow-xs"
                  >
                    View All Notifications & Alerts →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* PROFILE MINI BADGE — desktop only; on mobile it is in bottom tabs */}
          <div
            onClick={() => setIsProfileOpen(true)}
            className="hidden md:flex items-center gap-2 p-1.5 px-2 sm:px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 cursor-pointer transition-all hover:border-[#2B4B9E]/50 shrink-0"
          >
            <div className="w-7 h-7 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 overflow-hidden" style={{ backgroundColor: "#2B4B9E" }}>
              {userProfile.avatar ? (
                <img src={userProfile.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{userProfile.name.split(" ").map((n) => n[0]).join("")}</span>
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold leading-tight text-slate-900">{userProfile.name}</span>
              <span className="text-[10px] font-bold" style={{ color: "#2B4B9E" }}>{isGuest ? "Guest Mode" : "Passenger"}</span>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className={mapMode ? "flex-1 flex flex-col min-h-0 overflow-hidden" : "flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8"}>
        <div className={mapMode ? "flex-1 flex flex-col min-h-0 h-full" : "w-full animate-in fade-in duration-200"}>
          {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION TABS: Home, Explore, Profile */}
      {/* Trip is removed — use the floating "Plan a Trip" / "Find Bus Stop" buttons on the map */}
      <nav className="mobile-bottom-nav md:hidden grid grid-cols-3 items-stretch bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-1 pt-1.5 shadow-lg">
        <Link
          to="/dashboard"
          className={`flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-xl text-[11px] font-medium transition-all ${
            location.pathname === "/dashboard"
              ? "font-semibold"
              : "text-slate-500 hover:text-slate-800"
          }`}
          style={location.pathname === "/dashboard" ? { color: "#2B4B9E" } : undefined}
        >
          <Home className="w-5 h-5" />
          <span className="truncate">Home</span>
        </Link>

        {/* Trip tab removed — trip planning is accessed via FABs on the map */}

        <Link
          to="/"
          className={`flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-xl text-[11px] font-medium transition-all ${
            location.pathname === "/"
              ? "font-semibold"
              : "text-slate-500 hover:text-slate-800"
          }`}
          style={location.pathname === "/" ? { color: "#2B4B9E" } : undefined}
        >
          <Globe className="w-5 h-5 text-sky-500" />
          <span className="truncate">Explore</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className={`flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 py-1.5 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${
            isProfileOpen
              ? "font-semibold"
              : "text-slate-500 hover:text-slate-800"
          }`}
          style={isProfileOpen ? { color: "#2B4B9E" } : undefined}
        >
          <User className="w-5 h-5" style={{ color: "#2B4B9E" }} />
          <span className="truncate">Profile</span>
        </button>
      </nav>

      {/* PROFILE MODAL */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentName={userProfile.name}
        currentEmail={userProfile.email}
        currentPhone={userProfile.phone}
        currentAvatar={userProfile.avatar}
        isGuest={isGuest}
        onLogout={handleLogout}
      />

    </div>
  );
};

export default PassengerLayout;