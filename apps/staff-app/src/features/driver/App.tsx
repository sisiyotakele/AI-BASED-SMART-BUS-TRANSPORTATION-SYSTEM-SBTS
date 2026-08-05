import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DriverLogin from "./pages/DriverLogin";
import DriverDashboard from "./pages/DriverDashboard";
import IncidentPage from "./pages/IncidentPage";
import NotificationPage from "./pages/NotificationPage";
import MyTripPage from "./pages/MyTripPage";
import MyTripHistory from "./pages/MyTripHistory";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import DriverSignup from "./pages/DriverSignup";
import ForgotPasswordPage from "./pages/ForgotPassword";
import RouteMapPage from "./pages/RouteMapPage";
import GPSTrackingPage from "./pages/GPSTrackingPage";
function App() {
  // =========================
  // INCIDENT GLOBAL STATE
  // =========================
  const [incidents, setIncidents] = useState<any[]>([]);
  // =========================
  // NOTIFICATION GLOBAL STATE
  // =========================
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "Dispatch Communications",
      message: "Welcome to SBTS Driver System",
      time: "Just now",
      read: false,
    },
    {
      id: 2,
      type: "Route Updates",
      message:
        "Route 12 has been updated. Check the new stop sequence.",
      time: "10 minutes ago",
      read: false,
    },
    {
      id: 3,
      type: "Traffic Alerts",
      message:
        "Heavy traffic detected near Bole Road. Consider alternative route.",
      time: "20 minutes ago",
      read: false,
    },
    {
      id: 4,
      type: "Emergency Messages",
      message:
        "Emergency alert: Drive carefully due to road conditions.",
      time: "30 minutes ago",
      read: false,
    },
  ]);
  // =========================
  // LOAD INCIDENTS
  // =========================
  useEffect(() => {
    const savedIncidents =
      localStorage.getItem("incidents");
    if (savedIncidents) {
      setIncidents(JSON.parse(savedIncidents));
    }
  }, []);
  // =========================
  // SAVE INCIDENTS
  // =========================
  useEffect(() => {
    localStorage.setItem(
      "incidents",
      JSON.stringify(incidents)
    );
  }, [incidents]);
  // =========================
  // LOAD NOTIFICATIONS
  // =========================
  useEffect(() => {
    const savedNotifications =
      localStorage.getItem("notifications");
    if (savedNotifications) {
      setNotifications(
        JSON.parse(savedNotifications)
      );
    }
  }, []);
  // =========================
  // SAVE NOTIFICATIONS
  // =========================
  useEffect(() => {
    localStorage.setItem(
      "notifications",
      JSON.stringify(notifications)
    );
  }, [notifications]);
  // =========================
  // LOAD THEME
  // ========================
  useEffect(() => {
    const savedTheme =
      localStorage.getItem("theme");
    if(savedTheme === "dark"){
      document.body.classList.add("dark");
    }
    return () => {
      document.body.classList.remove("dark");
    };
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN */}
        <Route
          path="/"
          element={<DriverLogin />}
        />
        {/* FORGOT PASSWORD */}
        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />
        {/* SIGNUP */}
        <Route
          path="/signup"
          element={<DriverSignup />}
        />
        {/* DASHBOARD MAIN LAYOUT */}
        <Route
          path="/dashboard"
          element={
            <DriverDashboard
              notifications={notifications}
            />
          }
        >
          {/* DASHBOARD HOME */}
          <Route
            index
            element={
              <h2>Dashboard Home</h2>
            }
          />
          {/* MY TRIP */}
          <Route
            path="my-trip"
            element={<MyTripPage />}
          />
          {/* INCIDENT REPORT */}
          <Route
            path="incidents"
            element={
              <IncidentPage
                incidents={incidents}
                setIncidents={setIncidents}
                setNotifications={setNotifications}
              />
            }
          />
          {/* NOTIFICATIONS */}
          <Route
            path="notifications"
            element={
              <NotificationPage
                notifications={notifications}
                setNotifications={setNotifications}
              />
            }
          />
          {/* TRIP HISTORY */}
          <Route
            path="trip-history"
            element={<MyTripHistory />}
          />
          {/* ROUTE MAP */}
          <Route
            path="route-map"
            element={<RouteMapPage />}
          />
         {/* GPS */}
<Route
  path="gps"
  element={<GPSTrackingPage />}
/>
          {/* PROFILE */}
          <Route
            path="profile"
            element={<ProfilePage />}
          />
          {/* SETTINGS */}
          <Route
            path="settings"
            element={<SettingsPage />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
          )
}
export default App;