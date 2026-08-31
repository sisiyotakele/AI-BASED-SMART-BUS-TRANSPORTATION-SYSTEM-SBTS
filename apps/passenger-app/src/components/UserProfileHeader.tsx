import React, { useState, useRef, useEffect } from "react";
import { 
  LogOut, 
  History,
  Bell,
  X,
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Camera,
  Sun,
  Moon,
  MessageSquare,
  User,
  Phone,
  Mail,
  Save
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// DIRECT IMPORT: Place sheger-logo.jpg inside src/assets/
import shegerLogo from "../assets/sheger-logo.jpg";

// Mock history data
const MOCK_HISTORY = [
  {
    id: "tx-101",
    date: "Today, 2:15 PM",
    from: "Megenagna Terminal",
    to: "Bole Brass",
    busNumber: "Route 12 Express",
    fare: "15.00 ETB",
    status: "Completed",
  },
  {
    id: "tx-102",
    date: "Yesterday, 8:40 AM",
    from: "Alem Gena",
    to: "Mexico Square",
    busNumber: "Route 34",
    fare: "10.00 ETB",
    status: "Completed",
  },
];

// Mock notification data
const MOCK_NOTIFICATIONS = [
  {
    id: "notif-1",
    title: "Bus Delayed",
    message: "Route 12 is delayed by 8 mins due to high traffic near Megenagna.",
    time: "5m ago",
    type: "warning",
    unread: true,
  },
  {
    id: "notif-2",
    title: "Boarding Reminder",
    message: "SBTS-BUS-114 is arriving at Bole Brass stop in 4 minutes.",
    time: "20m ago",
    type: "info",
    unread: true,
  },
];

interface UserProfileProps {
  user?: {
    name: string;
    role: string;
    email: string;
    phone?: string;
  };
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const UserProfileHeader = ({ 
  
  user = { 
    name: "Abebe Bikila", 
    role: "Passenger", 
    email: "abebe.bikila@example.com",
    phone: "+251 91 123 4567"
  },
  isDarkMode = true,
  onToggleTheme,
}: 
UserProfileProps) => {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Profile Form States
  const [profileName, setProfileName] = useState(user.name);
  const [profilePhone, setProfilePhone] = useState(user.phone || "+251 91 123 4567");
  const [profileEmail, setProfileEmail] = useState(user.email);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => n.unread).length;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Sync Theme Mode with HTML DOM
  const handleThemeToggle = () => {
    if (onToggleTheme) {
      onToggleTheme();
    } else {
      document.documentElement.classList.toggle("dark");
    }
  };

  // Close active popovers when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.removeItem("token");
    sessionStorage.clear();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 dark:bg-[#0d1322]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 py-3 flex items-center justify-between text-slate-800 dark:text-white transition-colors duration-200">
      
      {/* 1. App Title with Sheger Logo */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-slate-800 border border-slate-700/60 shadow-md shrink-0 flex items-center justify-center font-bold text-indigo-400">
          <img 
            src={shegerLogo} 
            alt="Sheger Bus Logo" 
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
          Sheger Bus
        </h1>
      </div>

      {/* 2. Right Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* --- NOTIFICATIONS BUTTON & POPOVER --- */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => {
              setIsNotificationsOpen(!isNotificationsOpen);
              setIsHistoryOpen(false);
              setIsProfileOpen(false);
            }}
            className="p-2.5 bg-slate-100 dark:bg-[#1e222d] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer flex items-center gap-2"
            title="Notifications"
          >
            <div className="relative">
              <Bell className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              )}
            </div>
            <span className="text-xs font-bold hidden md:inline">Alerts</span>
          </button>

          {/* Notifications Dropdown */}
          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#1e222d] border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden z-50 text-slate-800 dark:text-slate-200 text-sm animate-in fade-in duration-150">
              <div className="bg-slate-100 dark:bg-[#293047] p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-600/20 text-indigo-500 dark:text-indigo-400 rounded-lg">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Notifications</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Updates & transit alerts</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsNotificationsOpen(false)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
                {MOCK_NOTIFICATIONS.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3 rounded-xl border transition-colors space-y-1 ${
                      item.unread 
                        ? "bg-slate-50 dark:bg-[#171a23] border-slate-200 dark:border-slate-700/80" 
                        : "bg-slate-100/60 dark:bg-[#141720]/60 border-slate-200 dark:border-slate-800/60 opacity-80"
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {item.type === "warning" && <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />}
                        {item.type === "info" && <Info className="w-3.5 h-3.5 text-indigo-500" />}
                        {item.title}
                      </span>
                      <span className="text-slate-400 text-[10px]">{item.time}</span>
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* --- TRIP HISTORY BUTTON & POPOVER --- */}
        <div className="relative" ref={historyRef}>
          <button
            type="button"
            onClick={() => {
              setIsHistoryOpen(!isHistoryOpen);
              setIsNotificationsOpen(false);
              setIsProfileOpen(false);
            }}
            className="p-2.5 bg-slate-100 dark:bg-[#1e222d] hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700/60 transition-colors cursor-pointer flex items-center gap-2"
            title="Trip History"
          >
            <History className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
            <span className="text-xs font-bold hidden sm:inline">History</span>
          </button>

          {/* Trip History Dropdown */}
          {isHistoryOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#1e222d] border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden z-50 text-slate-800 dark:text-slate-200 text-sm animate-in fade-in duration-150">
              <div className="bg-slate-100 dark:bg-[#293047] p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-600/20 text-indigo-500 dark:text-indigo-400 rounded-lg">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Trip History</h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Recent rides & tickets</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsHistoryOpen(false)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 space-y-2 max-h-72 overflow-y-auto">
                {MOCK_HISTORY.map((trip) => (
                  <div
                    key={trip.id}
                    className="p-3 bg-slate-50 dark:bg-[#171a23] hover:bg-slate-100 dark:hover:bg-[#252a38] border border-slate-200 dark:border-slate-800 rounded-xl transition-colors space-y-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px]">{trip.date}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {trip.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100 text-xs">
                      <span>{trip.busNumber}</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{trip.fare}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
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

        {/* --- USER PROFILE WIDGET & SETTINGS POPOVER --- */}
        <div className="relative inline-block" ref={profileRef}>
          <div className="flex items-center gap-2 sm:gap-3 bg-slate-100 dark:bg-[#0d1322] text-slate-900 dark:text-white p-1.5 sm:p-2 rounded-xl border border-slate-200 dark:border-slate-800 select-none">
            <button
              type="button"
              onClick={() => {
                setIsProfileOpen(!isProfileOpen);
                setIsNotificationsOpen(false);
                setIsHistoryOpen(false);
              }}
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity text-left outline-none cursor-pointer"
            >
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white text-xs sm:text-sm shadow-md overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getInitials(profileName)
                )}
              </div>

              <div className="hidden sm:flex flex-col pr-1">
                <span className="font-bold text-xs leading-tight text-slate-900 dark:text-slate-100">
                  {profileName}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                  {user.role}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleLogout}
              title="Log out"
              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer ml-1"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          {/* PASSENGER PROFILE & SETTINGS CARD */}
          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-[420px] bg-white dark:bg-[#1e222d] border border-slate-200 dark:border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden z-50 text-slate-800 dark:text-slate-200 text-sm animate-in fade-in duration-150">
              
              {/* Header Bar */}
              <div className="p-4 sm:p-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-700/60 bg-slate-100 dark:bg-[#293047]">
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Passenger Profile & Settings
                </h3>
                <button
                  onClick={() => setIsProfileOpen(false)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
                
                {/* Profile Photo Editor */}
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="relative group">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-indigo-100 dark:bg-indigo-600/20 border-2 border-indigo-500 flex items-center justify-center text-indigo-600 dark:text-indigo-300 font-bold text-2xl shadow-inner overflow-hidden">
                      {profileImage ? (
                        <img src={profileImage} alt="Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <span>{getInitials(profileName)}</span>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg border-2 border-white dark:border-[#1e222d] transition-transform hover:scale-110 cursor-pointer"
                      title="Change photo"
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleImageUpload} 
                      accept="image/*" 
                      className="hidden" 
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    Click camera icon to change photo
                  </span>
                </div>

                {/* Form Fields */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> Full Name
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#171a23] border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> Phone Number
                    </label>
                    <input
                      type="text"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#171a23] border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Email Address
                    </label>
                    <input
                      type="email"
                      value={profileEmail}
                      onChange={(e) => setProfileEmail(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#171a23] border border-slate-300 dark:border-slate-700/80 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Theme Mode Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-[#171a23] border border-slate-200 dark:border-slate-800 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 text-amber-500 rounded-lg">
                      {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">Theme Mode</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400">
                        {isDarkMode ? "Dark Theme Active" : "Light Theme Active"}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleThemeToggle}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-xs font-semibold text-slate-800 dark:text-indigo-300 rounded-lg border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    Toggle Mode
                  </button>
                </div>

                {/* Feedback Option */}
                <div className="p-3 bg-slate-50 dark:bg-[#171a23] border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-600/20 text-indigo-500 dark:text-indigo-400 rounded-lg">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">Send Feedback</h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Report bugs or request features</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowFeedbackInput(!showFeedbackInput)}
                      className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      {showFeedbackInput ? "Cancel" : "Write"}
                    </button>
                  </div>

                  {showFeedbackInput && (
                    <div className="pt-2 space-y-2 animate-in fade-in duration-150">
                      <textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="Share your thoughts about SBTS..."
                        rows={2}
                        className="w-full bg-white dark:bg-[#0d1322] border border-slate-300 dark:border-slate-700/80 rounded-lg p-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 resize-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setFeedbackText("");
                          setShowFeedbackInput(false);
                        }}
                        className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        Submit Feedback
                      </button>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(false)}
                    className="px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsProfileOpen(false)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Save Changes
                  </button>
                </div>

              </div>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};