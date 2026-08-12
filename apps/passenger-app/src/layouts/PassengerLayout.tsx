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
  Compass,
  User,
  Globe
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ProfileModal from "../features/profile/ProfileModal"; 
import { useAuth } from "../features/auth/AuthContext";
import shegerlogo from "../assets/sheger-logo.jpg";

interface LayoutProps {
  children: React.ReactNode;
  pageTitle?: string;
}

// Mock Trip History for Header Popout
const MOCK_HEADER_HISTORY = [
  {
    id: "tx-101",
    date: "Today, 2:15 PM",
    from: "Megenagna Terminal",
    to: "Bole Airport",
    busNumber: "Route 12 Express",
    fare: "15.00 ETB",
    status: "Completed",
  },
  {
    id: "tx-102",
    date: "Yesterday, 8:40 AM",
    from: "CMC Michael",
    to: "Mexico Square",
    busNumber: "Route 04 Direct",
    fare: "12.00 ETB",
    status: "Completed",
  },
  {
    id: "tx-103",
    date: "Jul 24, 2026",
    from: "Tor Hailoch",
    to: "Stadium",
    busNumber: "Route 18 Standard",
    fare: "10.00 ETB",
    status: "Completed",
  },
];

// Mock Notifications for Header Popout
const MOCK_HEADER_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Bus Delay Alert",
    message: "Route 12 is delayed by 8 mins due to high congestion near Megenagna.",
    time: "5m ago",
    type: "warning",
    unread: true,
  },
  {
    id: "notif-2",
    title: "Boarding Reminder",
    message: "SBTS-BUS-114 is arriving at CMC Michael stop in 4 minutes.",
    time: "20m ago",
    type: "info",
    unread: true,
  },
  {
    id: "notif-3",
    title: "Pass Confirmed",
    message: "Your digital boarding pass (SBTS-QR-994821) is active for Route 12.",
    time: "1h ago",
    type: "success",
    unread: false,
  },
];

export const PassengerLayout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isGuest, logout: authLogout } = useAuth();
  const location = useLocation();

  // Popover States
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

  const unreadCount = MOCK_HEADER_NOTIFICATIONS.filter((n) => n.unread).length;

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
    <div className="min-h-screen flex flex-col font-sans bg-[#F8FAFC] text-slate-800 selection:bg-indigo-500 selection:text-white">
      
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

        {/* RIGHT SIDE: Desktop Nav (Home, Trip, Explore) + History + Notifications + Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          
          {/* DESKTOP NAVIGATION LINKS: Home, Trip, Explore */}
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

            <Link 
              to="/trip" 
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                location.pathname === "/trip"
                  ? "bg-[#2B4B9E] text-white border-[#2B4B9E]"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200/80"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Trip</span>
            </Link>

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
          <div className="relative" ref={historyRef}>
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
                  {MOCK_HEADER_HISTORY.map((trip) => (
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
                  ))}
                </div>
              </div>
            )}
          </div>

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
                  {MOCK_HEADER_NOTIFICATIONS.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border transition-colors space-y-1 ${
                        item.unread 
                          ? "bg-slate-50 border-slate-200" 
                          : "bg-white border-slate-100 opacity-80"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-900 flex items-center gap-1.5">
                          {item.type === "warning" && <AlertTriangle className="w-3.5 h-3.5" style={{ color: "#12B2E4" }} />}
                          {item.type === "info" && <Info className="w-3.5 h-3.5 text-indigo-500" />}
                          {item.type === "success" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                          {item.title}
                        </span>
                        <span className="text-slate-400 text-[10px] font-medium">{item.time}</span>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {item.message}
                      </p>
                    </div>
                  ))}
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
      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 pb-24 md:pb-8">
        <div className="w-full animate-in fade-in duration-200">
          {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION TABS: Home, Trip, Explore, Profile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 px-2 py-2 flex items-center justify-around shadow-lg">
        <Link
          to="/dashboard"
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
            location.pathname === "/dashboard"
              ? "font-extrabold"
              : "text-slate-500 hover:text-slate-800"
          }`}
          style={location.pathname === "/dashboard" ? { color: "#2B4B9E" } : undefined}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px]">Home</span>
        </Link>

        <Link
          to="/trip"
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
            location.pathname === "/trip"
              ? "font-extrabold"
              : "text-slate-500 hover:text-slate-800"
          }`}
          style={location.pathname === "/trip" ? { color: "#2B4B9E" } : undefined}
        >
          <Compass className="w-5 h-5" />
          <span className="text-[10px]">Trip</span>
        </Link>

        <Link
          to="/"
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
            location.pathname === "/"
              ? "font-extrabold"
              : "text-slate-500 hover:text-slate-800"
          }`}
          style={location.pathname === "/" ? { color: "#2B4B9E" } : undefined}
        >
          <Globe className="w-5 h-5 text-sky-500" />
          <span className="text-[10px]">Explore</span>
        </Link>

        <button
          type="button"
          onClick={() => setIsProfileOpen(true)}
          className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isProfileOpen
              ? "font-extrabold"
              : "text-slate-500 hover:text-slate-800"
          }`}
          style={isProfileOpen ? { color: "#2B4B9E" } : undefined}
        >
          <User className="w-5 h-5" style={{ color: "#2B4B9E" }} />
          <span className="text-[10px]">Profile</span>
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