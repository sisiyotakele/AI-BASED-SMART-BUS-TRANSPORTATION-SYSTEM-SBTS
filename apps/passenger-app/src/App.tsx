import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthPage } from "@/pages/AuthPage";
import { ForgotPasswordPage } from "@/features/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "@/features/auth/ResetPasswordPage";
import { DashboardPage } from "@/pages/DashboardPage";
// NOTE: LiveTrackingPage route is commented out — tracking is now on the map-first dashboard
// import { LiveTrackingPage } from "@/pages/LiveTrackingPage";
import { TicketsPage } from "@/pages/TicketsPage";
// NOTE: RoutesPage route is commented out — trip search is now in the MapSidePanel Search tab
// import { RoutesPage } from "@/pages/RoutesPage";
import { HistoryPage } from "@/pages/HistoryPage";
import { NotificationsPage } from "@/pages/NotificationsPage";
import { LandingPage } from "@/pages/LandingPage";
import { AuthProvider, useAuth } from "@/features/auth/AuthContext";

// Route Guard: Protects routes using AuthContext, allowing authenticated users OR guests
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isGuest, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600 text-sm font-semibold">
        Loading session...
      </div>
    );
  }

  if (!isAuthenticated && !isGuest) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Landing Page at Root URL */}
          <Route path="/" element={<LandingPage />} />

          {/* Public Auth Routes */}
          <Route path="/auth" element={<AuthPage />} />
          {/* Redirect old auth routes */}
          <Route path="/login" element={<Navigate to="/auth?mode=login" replace />} />
          <Route path="/register" element={<Navigate to="/auth?mode=register" replace />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Protected Passenger Dashboard & App Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          {/* NOTE: /tracking is now embedded in the full-screen map on /dashboard (LiveMapView always visible) */}
          {/* <Route
            path="/tracking"
            element={
              <ProtectedRoute>
                <LiveTrackingPage />
              </ProtectedRoute>
            }
          /> */}
          <Route
            path="/tickets"
            element={
              <ProtectedRoute>
                <TicketsPage />
              </ProtectedRoute>
            }
          />
          {/* NOTE: /trip route search is now embedded in the Search tab of the MapSidePanel on /dashboard */}
          {/* <Route
            path="/trip"
            element={
              <ProtectedRoute>
                <RoutesPage />
              </ProtectedRoute>
            }
          /> */}
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <NotificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}