import { useNavigate, useLocation } from "react-router-dom";

import {
  FaBus,
  FaThLarge,
  FaProjectDiagram,
  FaRoute,
  FaLocationArrow,
  FaExclamationTriangle,
  FaBell,
  FaHistory,
  FaUser,
  FaCog,
  FaSignOutAlt
} from "react-icons/fa";

import "../styles/Sidebar.css";


function Sidebar({ notifications }: any) {

  const navigate = useNavigate();
  const location = useLocation();
const handleLogout = () => {

  // remove saved user session
  localStorage.removeItem("token");
  localStorage.removeItem("user");

  // optional: remove theme if you want reset
  // localStorage.removeItem("theme");

  // redirect to login page
navigate("/")
};

  const isActive = (path: string) => {
    return location.pathname === path
      ? "menu-item active-menu"
      : "menu-item";
  };
  const unreadCount = notifications.filter(
  (n:any) => !n.read
).length;


  return (

    <div className="sidebar">


      {/* LOGO */}
      <div className="sidebar-logo">

        <div className="logo-circle">
          <FaBus />
        </div>

        <div>
          <h2>SBTS</h2>
          <p>Sheger Bus System</p>
        </div>

      </div>





      {/* MENU */}
      <div className="menu">


        {/* DASHBOARD */}
        <div
          className={isActive("/dashboard")}
          onClick={() => navigate("/dashboard")}
        >
          <FaThLarge />
          <span>Dashboard</span>
        </div>



        {/* MY TRIPS */}
        <div
          className={isActive("/dashboard/my-trip")}
          onClick={() => navigate("/dashboard/my-trip")}
        >
          <FaProjectDiagram />
          <span>My Trips</span>
        </div>



        {/* INCIDENT REPORT */}
        <div
          className={isActive("/dashboard/incidents")}
          onClick={() => navigate("/dashboard/incidents")}
        >
          <FaExclamationTriangle />
          <span>Incident Reports</span>
        </div>




        {/* NOTIFICATIONS */}
       <div
  className={isActive("/dashboard/notifications")}
  onClick={() => navigate("/dashboard/notifications")}
>
  <FaBell />

  <span>
    Notifications
  </span>

  
</div>



     {/* ROUTE MAP */}
<div
  className={isActive("/dashboard/route-map")}
  onClick={() => navigate("/dashboard/route-map")}
>
  <FaRoute />
  <span>Route Map</span>
</div>



        {/* GPS TRACKING */}
        <div
          className={isActive("/dashboard/gps")}
          onClick={() => navigate("/dashboard/gps")}
        >
          <FaLocationArrow />
          <span>GPS Tracking</span>
        </div>




        {/* TRIP HISTORY */}
        <div
          className={isActive("/dashboard/trip-history")}
          onClick={() => navigate("/dashboard/trip-history")}
        >
          <FaHistory />
          <span>Trip History</span>
        </div>





        {/* PROFILE */}
        <div
          className={isActive("/dashboard/profile")}
          onClick={() => navigate("/dashboard/profile")}
        >
          <FaUser />
          <span>Profile</span>
        </div>





        {/* SETTINGS */}
        <div
          className={isActive("/dashboard/settings")}
          onClick={() => navigate("/dashboard/settings")}
        >
          <FaCog />
          <span>Settings</span>
        </div>



      </div>




  {/* LOGOUT */}
<div 
  className="logout"
  onClick={() => navigate("/")}
>
  <FaSignOutAlt />

  <span>
    Sign Out
  </span>

</div>

    </div>

  );
}


export default Sidebar;