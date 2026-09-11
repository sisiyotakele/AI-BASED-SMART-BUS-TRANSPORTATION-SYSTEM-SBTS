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
  Search,
  Bus,
  Loader2
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ProfileModal from "../features/profile/ProfileModal"; 
import { useAuth } from "../features/auth/AuthContext";
import shegerlogo from "../assets/sheger-logo.jpg";
import { notificationsApi, tripsApi, BackendTrip, routesApi, BackendStop } from "@/lib/api";
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
  const navigate = useNavigate();

  // Popover States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [headerNotifications, setHeaderNotifications] = useState<HeaderNotification[]>([]);
  const [headerHistory, setHeaderHistory] = useState<HeaderTripHistory[]>([]);
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [headerSearchResults, setHeaderSearchResults] = useState<{stops: BackendStop[]; routes: any[]} | null>(null);
  const [headerSearching, setHeaderSearching] = useState(false);
  const [headerSearchMessage, setHeaderSearchMessage] = useState<string | null>(null);
  const [showHeaderResults, setShowHeaderResults] = useState(false);
  const headerSearchRef = useRef<HTMLDivElement>(null);

  // Close header search results on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerSearchRef.current && !headerSearchRef.current.contains(event.target as Node)) {
        setShowHeaderResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleHeaderSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = headerSearchQuery.trim();
    if (!query) return;

    setHeaderSearching(true);
    setHeaderSearchMessage(null);
    setShowHeaderResults(true);

    try {
      // Fetch stops and routes from the database
      const [stopsRes, routesRes] = await Promise.allSettled([
        routesApi.getStops(),
        routesApi.getRoutes(),
      ]);

      const allStops: BackendStop[] =
        stopsRes.status === "fulfilled" && Array.isArray(stopsRes.value.data?.data)
          ? stopsRes.value.data.data
          : [];

      const allRoutes: any[] =
        routesRes.status === "fulfilled" && Array.isArray(routesRes.value.data?.data)
          ? routesRes.value.data.data
          : [];

      // Filter stops matching the query
      const matchedStops = allStops.filter((s) =>
        s.stopName.toLowerCase().includes(query.toLowerCase()) ||
        (s.address && s.address.toLowerCase().includes(query.toLowerCase()))
      );

      // Filter routes matching the query
      const matchedRoutes = allRoutes.filter((r) =>
        (r.routeName || r.name || "").toLowerCase().includes(query.toLowerCase()) ||
        (r.description || "").toLowerCase().includes(query.toLowerCase())
      );

      // Sort alphabetically
      matchedStops.sort((a, b) => a.stopName.localeCompare(b.stopName));
      matchedRoutes.sort((a: any, b: any) => (a.routeName || "").localeCompare(b.routeName || ""));

      setHeaderSearchResults({ stops: matchedStops, routes: matchedRoutes });

      if (matchedStops.length === 0 && matchedRoutes.length === 0) {
        setHeaderSearchMessage(`No bus stops or routes found matching "${query}". Try searching for stations like Akaki, Megenagna, Bole, or Mexico.`);
      } else {
        setHeaderSearchMessage(null);
      }
    } catch (err) {
      console.warn("Header search failed:", err);
      setHeaderSearchMessage("Could not search the database. Please try again.");
      setHeaderSearchResults(null);
    } finally {
      setHeaderSearching(false);
    }
  };

  const handleSelectHeaderStop = (stop: BackendStop) => {
    setHeaderSearchQuery(stop.stopName);
    setShowHeaderResults(false);

    // Look for any route in headerSearchResults that connects with this stop
    const matchingRoute = headerSearchResults?.routes?.find((r: any) =>
      (r.routeName || "").toLowerCase().includes(stop.stopName.toLowerCase()) ||
      r.startStop?.stopName?.toLowerCase() === stop.stopName.toLowerCase() ||
      r.endStop?.stopName?.toLowerCase() === stop.stopName.toLowerCase()
    );

    const originName = matchingRoute?.startStop?.stopName || "Central Station";
    const destName = stop.stopName;
    const busName = matchingRoute?.routeName || `Bus to ${stop.stopName}`;

    const selectedRoute = {
      id: matchingRoute?.id || `stop-${stop.id}`,
      busNumber: busName,
      routeVia: `${originName} → ${destName}`,
      totalTripMinutes: matchingRoute?.estimatedDurationMin || 20,
      fare: matchingRoute?.fare ? `${matchingRoute.fare}.00 ETB` : "15.00 ETB",
      nearestStation: { name: stop.stopName, walkTimeMinutes: 2 },
    };

    const routeData = {
      selectedRoute,
      origin: originName,
      destination: destName,
      viaStops: [destName],
    };

    // Navigate to dashboard live map with full state
    navigate("/dashboard#live-route-map", { state: routeData });

    // Also dispatch custom events so side panel and map update synchronously
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("sbts:select_route", {
          detail: routeData,
        })
      );
      window.dispatchEvent(
        new CustomEvent("sbts:header_search_stop", {
          detail: { stopName: stop.stopName, latitude: stop.latitude, longitude: stop.longitude },
        })
      );
    }, 50);
  };

  const handleSelectHeaderRoute = (route: any) => {
    const routeName = route.routeName || route.name || "Route";
    setHeaderSearchQuery(routeName);
    setShowHeaderResults(false);

    const originName = route.startStop?.stopName || route.origin || "Origin";
    const destName = route.endStop?.stopName || route.destination || "Destination";
    const viaStops = [originName, destName];

    const selectedRoute = {
      id: route.id,
      busNumber: routeName,
      routeVia: `${originName} → ${destName}`,
      totalTripMinutes: route.estimatedDurationMin || 25,
      fare: route.fare ? `${route.fare}.00 ETB` : "15.00 ETB",
      nearestStation: { name: originName, walkTimeMinutes: 3 },
    };

    const routeData = {
      selectedRoute,
      origin: originName,
      destination: destName,
      viaStops,
    };

    // Navigate to dashboard live map with state
    navigate("/dashboard#live-route-map", { state: routeData });

    // Dispatch event to select this route on the map/side panel
    setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("sbts:select_route", {
          detail: routeData,
        })
      );
    }, 50);
  };

  // Derive user profile from AuthContext (GET /auth/me) or Guest fallback
  const userProfile = {
    name: user?.fullName || (isGuest ? "Guest Commuter" : "Passenger"),
    email: user?.email || (isGuest ? "guest@shegerbus.et" : "passenger@shegerbus.et"),
    phone: user?.phone || (isGuest ? "N/A (Guest Session)" : "+251..."),
    avatar: "",
    passengerId: user?.id ? `PAS-${user.id.slice(0, 6)}` : (isGuest ? "GUEST-PASSER" : "PAS-9821")
  };

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
        <div ref={headerSearchRef} className="hidden md:flex items-center flex-1 max-w-md mx-4 relative">
          <form 
            onSubmit={handleHeaderSearch}
            className="w-full"
          >
            <div className="relative w-full flex items-center">
              {headerSearching ? (
                <Loader2 className="w-4 h-4 text-[#2B4B9E] absolute left-3.5 pointer-events-none animate-spin" />
              ) : (
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              )}
              <input
                type="text"
                value={headerSearchQuery}
                onChange={(e) => {
                  setHeaderSearchQuery(e.target.value);
                  if (!e.target.value.trim()) {
                    setShowHeaderResults(false);
                    setHeaderSearchResults(null);
                    setHeaderSearchMessage(null);
                  }
                }}
                placeholder="Find bus stop or route… (Press Enter)"
                className="w-full pl-9 pr-20 py-2 bg-slate-100/90 hover:bg-slate-100 focus:bg-white rounded-2xl text-xs font-semibold text-slate-900 border border-slate-200/80 focus:border-[#2B4B9E] focus:ring-2 focus:ring-[#2B4B9E]/10 outline-none transition-all placeholder:text-slate-400 shadow-2xs"
              />
              <button
                type="submit"
                disabled={headerSearching}
                className="absolute right-1.5 px-2.5 py-1 bg-[#2B4B9E] hover:bg-[#1e3570] text-white text-[11px] font-extrabold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50"
              >
                <span>{headerSearching ? "..." : "Search"}</span>
                <span className="text-[9px] opacity-70">⏎</span>
              </button>
            </div>
          </form>

          {/* Search Results Dropdown */}
          {showHeaderResults && (
            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-h-80 overflow-y-auto p-2">
              {headerSearchMessage ? (
                <div className="py-6 px-4 text-center">
                  <Search className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold text-slate-500">{headerSearchMessage}</p>
                </div>
              ) : headerSearchResults ? (
                <div className="space-y-1">
                  {/* Matched Stops */}
                  {headerSearchResults.stops.length > 0 && (
                    <>
                      <p className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        Bus Stations ({headerSearchResults.stops.length})
                      </p>
                      {headerSearchResults.stops.slice(0, 8).map((stop) => (
                        <button
                          key={stop.id}
                          type="button"
                          onClick={() => handleSelectHeaderStop(stop)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                            <MapPin className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate">{stop.stopName}</p>
                            {stop.address && (
                              <p className="text-[10px] text-slate-400 truncate">{stop.address}</p>
                            )}
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded font-bold border border-emerald-100 shrink-0">
                            Station
                          </span>
                        </button>
                      ))}
                    </>
                  )}

                  {/* Matched Routes */}
                  {headerSearchResults.routes.length > 0 && (
                    <>
                      <p className="px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400 mt-1">
                        Bus Routes ({headerSearchResults.routes.length})
                      </p>
                      {headerSearchResults.routes.slice(0, 6).map((route: any) => (
                        <button
                          key={route.id}
                          type="button"
                          onClick={() => handleSelectHeaderRoute(route)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <div className="w-7 h-7 rounded-lg bg-sky-50 text-[#2B4B9E] border border-sky-100 flex items-center justify-center shrink-0">
                            <Bus className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate">{route.routeName || route.name}</p>
                            {route.description && (
                              <p className="text-[10px] text-slate-400 truncate">{route.description}</p>
                            )}
                          </div>
                          <span className="text-[9px] px-1.5 py-0.5 bg-sky-50 text-sky-700 rounded font-bold border border-sky-100 shrink-0 uppercase">
                            Route
                          </span>
                        </button>
                      ))}
                    </>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>

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