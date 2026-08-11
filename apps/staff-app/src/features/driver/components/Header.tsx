// src/features/driver/components/Header.tsx

import {
  FaBell,
  FaCog,
  FaUserCircle,
  FaSearch,
  FaChevronDown,
} from "react-icons/fa";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";

interface Notification {
  id: number;
  message: string;
  time: string;
  read: boolean;
}

interface HeaderProps {
  notifications: Notification[];
}

const Header: React.FC<HeaderProps> = ({ notifications }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [dateTime, setDateTime] = useState(new Date());
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [driverName, setDriverName] = useState("Biruk Awel");
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadProfile = () => {
      const savedProfile = localStorage.getItem("driverProfile");
      if (savedProfile) {
        try {
          const parsed = JSON.parse(savedProfile);
          setDriverName(parsed.name);
        } catch {
          setDriverName("Biruk Awel");
        }
      }
    };

    loadProfile();
    window.addEventListener("profileUpdated", loadProfile);

    return () => {
      window.removeEventListener("profileUpdated", loadProfile);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard" || path === "/driver") return "Driver Dashboard";
    if (path.includes("/my-trip")) return "My Trip";
    if (path.includes("/incidents")) return "Incident Report";
    if (path.includes("/notifications")) return "Notifications";
    if (path.includes("/trip-history")) return "Trip History";
    if (path.includes("/route-map")) return "Live Route Map";
    if (path.includes("/profile")) return "Driver Profile";
    if (path.includes("/settings")) return "Settings";
    return "Driver Dashboard";
  };

  const searchItems = [
    { name: "My Trip", path: "/driver" },
    { name: "Trip History", path: "/driver/trip-history" },
    { name: "Notifications", path: "/driver/notifications" },
    { name: "Incident Report", path: "/driver/incident" },
    { name: "Live Route Map", path: "/driver/route-map" },
    { name: "Settings", path: "/driver/settings" },
    { name: "Driver Profile", path: "/driver/profile" },
  ];

  const filteredItems = searchItems.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const navigateTo = (path: string) => {
    navigate(path);
    setSearch("");
    setProfileOpen(false);
  };

  return (
    <header className="h-[60px] sm:h-[70px] bg-white dark:bg-gray-800 flex items-center px-3 sm:px-4 md:px-6 gap-2 sm:gap-4 md:gap-6 shadow-sm border-b border-gray-100 dark:border-gray-700">
      <h2 className="text-sm sm:text-lg font-semibold text-gray-800 dark:text-white whitespace-nowrap">
        {getTitle()}
      </h2>

      <div className="relative flex-1 max-w-[300px] sm:max-w-[450px]">
        <div className="flex items-center gap-2 h-[34px] sm:h-[38px] bg-gray-100 dark:bg-gray-700 rounded-full px-3 sm:px-4 text-gray-500 dark:text-gray-400">
          <FaSearch className="text-xs sm:text-sm" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        {search && (
          <div className="absolute top-[40px] sm:top-[45px] left-0 w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden z-50 border border-gray-100 dark:border-gray-700">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <div
                  key={item.name}
                  className="px-3 sm:px-4 py-2 sm:py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-xs sm:text-sm text-gray-700 dark:text-gray-300"
                  onClick={() => navigateTo(item.path)}
                >
                  {item.name}
                </div>
              ))
            ) : (
              <div className="px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-400 dark:text-gray-500">
                No results found
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 ml-auto">
        <div className="hidden xs:flex flex-col text-right text-[10px] sm:text-xs">
          <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">
            {dateTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <small className="text-[9px] sm:text-xs text-gray-400 dark:text-gray-500">
            {dateTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
          </small>
        </div>

        <div
          className={`relative text-base sm:text-xl cursor-pointer transition-transform hover:scale-110 hover:text-[#12B2E4] ${
            unreadCount > 0 ? "text-[#12B2E4]" : "text-gray-600 dark:text-gray-400"
          }`}
          onClick={() => navigateTo("/driver/notifications")}
        >
          <FaBell />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[8px] sm:text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </div>

        <FaCog
          className="text-base sm:text-xl cursor-pointer text-gray-600 dark:text-gray-400 hover:text-[#12B2E4] transition-transform hover:scale-110"
          onClick={() => navigateTo("/driver/settings")}
        />

        <div className="relative" ref={profileRef}>
          <div
            className="flex items-center gap-1 sm:gap-2 cursor-pointer"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <FaUserCircle className="text-xl sm:text-2xl text-gray-500 dark:text-gray-400 hover:text-[#12B2E4] transition-colors" />
            <div className="hidden sm:flex flex-col leading-tight">
              <strong className="text-xs sm:text-sm text-gray-800 dark:text-white">{driverName}</strong>
              <small className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">Driver</small>
            </div>
            <FaChevronDown className={`text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
          </div>

          {profileOpen && (
            <div className="absolute right-0 top-[40px] sm:top-[50px] w-[180px] sm:w-[220px] bg-white dark:bg-gray-800 rounded-xl shadow-lg p-3 sm:p-4 z-50 border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-200">
              <h4 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">{driverName}</h4>
              <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 mb-2 sm:mb-3">Professional Driver</p>

              <button
                onClick={() => navigateTo("/driver/profile")}
                className="w-full py-2 sm:py-2.5 mb-1.5 sm:mb-2 bg-[#12B2E4] hover:bg-[#0e9ed4] text-white font-semibold rounded-lg transition-all hover:translate-y-[-1px] shadow-sm hover:shadow text-xs sm:text-sm touch-manipulation"
              >
                View Profile
              </button>

              <button
                onClick={() => navigateTo("/driver/settings")}
                className="w-full py-2 sm:py-2.5 mb-1.5 sm:mb-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-all hover:translate-y-[-1px] text-xs sm:text-sm touch-manipulation"
              >
                Settings
              </button>

              <button
                onClick={() => navigateTo("/login")}
                className="w-full py-2 sm:py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-all hover:translate-y-[-1px] shadow-sm hover:shadow text-xs sm:text-sm touch-manipulation"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;