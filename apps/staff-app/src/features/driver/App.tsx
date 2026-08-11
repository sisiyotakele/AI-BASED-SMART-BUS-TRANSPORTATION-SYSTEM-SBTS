import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MyTripPage from "./pages/MyTripPage";
import RouteMapPage from "./pages/RouteMapPage";
import MyTripHistory from "./pages/MyTripHistory";
import NotificationPage from "./pages/NotificationPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import IncidentPage from "./pages/IncidentPage";

// Sample location data (will be replaced with actual GPS)
const defaultLocation = {
  latitude: 9.03,
  longitude: 38.74,
};

function App() {
  // Shared state for notifications and incidents
  const [notifications, setNotifications] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Main/Default Route - MyTripPage */}
        <Route 
          path="/" 
          element={<MyTripPage location={defaultLocation} />} 
        />
        
        {/* Driver Routes */}
        <Route 
          path="/driver" 
          element={<MyTripPage location={defaultLocation} />} 
        />
        
        <Route 
          path="/driver/route-map" 
          element={<RouteMapPage />} 
        />
        
        <Route 
          path="/driver/trip-history" 
          element={<MyTripHistory />} 
        />
        
        <Route 
          path="/driver/notifications" 
          element={
            <NotificationPage 
              notifications={notifications} 
              setNotifications={setNotifications} 
            />
          } 
        />
        
        <Route 
          path="/driver/profile" 
          element={<ProfilePage />} 
        />
        
        <Route 
          path="/driver/settings" 
          element={<SettingsPage />} 
        />
        
        <Route 
          path="/driver/incident" 
          element={
            <IncidentPage 
              incidents={incidents} 
              setIncidents={setIncidents} 
              setNotifications={setNotifications} 
            />
          } 
        />
        
        {/* Placeholder routes for other features */}
        <Route 
          path="/driver/fuel-log" 
          element={
            <div className="min-h-screen bg-gray-50 p-6">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900">Fuel Log</h1>
                <p className="text-gray-500 mt-2">Fuel tracking feature coming soon...</p>
              </div>
            </div>
          } 
        />
        
        <Route 
          path="/driver/vehicle-check" 
          element={
            <div className="min-h-screen bg-gray-50 p-6">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900">Vehicle Inspection</h1>
                <p className="text-gray-500 mt-2">Vehicle inspection feature coming soon...</p>
              </div>
            </div>
          } 
        />
        
        <Route 
          path="/driver/support" 
          element={
            <div className="min-h-screen bg-gray-50 p-6">
              <div className="max-w-4xl mx-auto">
                <h1 className="text-2xl font-bold text-gray-900">Support</h1>
                <p className="text-gray-500 mt-2">Support center coming soon...</p>
              </div>
            </div>
          } 
        />
        
        {/* Login Route (if needed) */}
        <Route 
          path="/login" 
          element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
                <h1 className="text-2xl font-bold text-gray-900 text-center">Driver Login</h1>
                <p className="text-gray-500 text-center mt-2">Sign in to start your shift</p>
                <button 
                  onClick={() => window.location.href = "/driver"}
                  className="w-full mt-6 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  Login (Demo)
                </button>
              </div>
            </div>
          } 
        />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<MyTripPage location={defaultLocation} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;