import {
  FaBell,
  FaCog,
  FaUserCircle,
  FaSearch
} from "react-icons/fa";
import { 
  useNavigate,
  useLocation
} from "react-router-dom";
import { useEffect, useState } from "react";
import "../styles/Header.css";
function Header({ notifications }: any) {
  const navigate = useNavigate();
  const location = useLocation();
  const [dateTime, setDateTime] = useState(new Date());
  const [search, setSearch] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [driverName, setDriverName] = useState("Biruk Awel");
useEffect(() => {

  const loadProfile = () => {

    const savedProfile = localStorage.getItem("driverProfile");

    if (savedProfile) {
      const parsed = JSON.parse(savedProfile);
      setDriverName(parsed.name);
    }

  };

  loadProfile();

  window.addEventListener("profileUpdated", loadProfile);

  return () => {
    window.removeEventListener("profileUpdated", loadProfile);
  };

}, []);
  // LIVE TIME
  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  // NOTIFICATION COUNT
  const unreadCount = notifications.filter(
    (n:any) => !n.read
  ).length;
  // PAGE TITLE
  const getTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard")
      return "Driver Dashboard";
    if (path.includes("/dashboard/my-trip"))
      return "My Trip";
    if (path.includes("/dashboard/incidents"))
      return "Incident Report";
    if (path.includes("/dashboard/notifications"))
      return "Notifications";
    if (path.includes("/dashboard/trip-history"))
      return "Trip History";
    if (path.includes("/dashboard/route-map"))
      return "Live Route Map";
    if (path.includes("/dashboard/gps"))
      return "GPS Tracking";
    if (path.includes("/dashboard/profile"))
      return "Driver Profile";
    if (path.includes("/dashboard/settings"))
      return "Settings";
    return "Driver Dashboard";
  };
  // SEARCH ITEMS
  const searchItems = [
    {
      name:"My Trip",
      path:"/dashboard/my-trip"
    },
    {
      name:"Trip History",
      path:"/dashboard/trip-history"
    },
    {
      name:"Notifications",
      path:"/dashboard/notifications"
    },
    {
      name:"Incident Report",
      path:"/dashboard/incidents"
    },
    {
      name:"Live Route Map",
      path:"/dashboard/route-map"
    },
    {
      name:"GPS Tracking",
      path:"/dashboard/gps"
    },
    {
      name:"Settings",
      path:"/dashboard/settings"
    },
    {
      name:"Driver Profile",
      path:"/dashboard/profile"
    }
  ];
  const filteredItems = searchItems.filter(item =>
    item.name
    .toLowerCase()
    .includes(search.toLowerCase())
  );
  return (
    <div className="header">
      {/* TITLE */}
      <h2 className="header-title">
        {getTitle()}
      </h2>
      {/* SEARCH */}
      <div className="search-container">
        <div className="header-search">
          <FaSearch />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e)=>setSearch(e.target.value)}
          />
        </div>
        {
          search && (
            <div className="search-results">
              {
                filteredItems.map((item)=>(
                  <div
                    key={item.name}
                    className="search-item"
                    onClick={()=>{
                      navigate(item.path);
                      setSearch("");
                    }}
                  >
                    {item.name}
                  </div>
                ))
              }
            </div>
          )
        }
      </div>
      {/* RIGHT SIDE */}
      <div className="header-right">
        {/* DATE TIME */}
        <div className="datetime">
          <span>
            {dateTime.toLocaleTimeString()}
          </span>
          <small>
            {dateTime.toLocaleDateString()}
          </small>
        </div>
        {/* NOTIFICATION */}
        <div
          className={
            unreadCount > 0
            ?
            "header-icon notification-icon has-unread"
            :
            "header-icon notification-icon"
          }
          onClick={()=>navigate("/dashboard/notifications")}
        >
          <FaBell />
          {
            unreadCount > 0 && (
              <span className="bell-badge">
                {unreadCount}
              </span>
            )
          }
        </div>
        {/* SETTINGS */}
        <FaCog
          className="header-icon"
          onClick={()=>navigate("/dashboard/settings")}
        />
        {/* PROFILE DROPDOWN */}
        <div className="profile-menu-container">
          <div
            className="profile-trigger"
            onClick={()=>setProfileOpen(!profileOpen)}
          >
            <FaUserCircle className="header-icon"/>
            <div className="profile-name">
              <strong>{driverName}</strong>
              <small> Driver</small>
            </div>
          </div>
          {
            profileOpen && (
              <div className="profile-dropdown">
                <h4> {driverName}</h4>
      <p> Professional Driver </p>
                <button
                  onClick={()=>{
                    navigate("/dashboard/profile");
                    setProfileOpen(false);
                  }}
                >
                  View Profile
                </button>
                <button
                  onClick={()=>{
                    navigate("/dashboard/settings");
                    setProfileOpen(false);
                  }}
                >
                  Settings
                </button>
                <button
                  className="logout-btn"
                  onClick={()=>navigate("/")}
                >
                  Logout
                </button>
              </div>
            )
          }
        </div>
      </div> 
    </div>
  );
}
export default Header;