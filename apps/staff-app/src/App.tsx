import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './contexts/ThemeContext';
import { ConfirmProvider } from './contexts/ConfirmContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './features/admin/layout/Layout';

import { Login } from './pages/Login';
import { ChangePassword } from './pages/ChangePassword';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './features/admin/pages/Dashboard';
import { Tracking } from './features/admin/pages/Tracking';
import { Incidents } from './features/admin/pages/Incidents';
import { Routes as RoutesPage } from './features/admin/pages/Routes';
import { RouteDetails } from './features/admin/pages/RouteDetails';
import { ManageRouteStops } from './features/admin/pages/ManageRouteStops';
import { Stops } from './features/admin/pages/Stops';
import { Trips } from './features/admin/pages/Trips';
import { CreateTrip } from './features/admin/pages/CreateTrip';
import { TripDetails } from './features/admin/pages/TripDetails';
import { Drivers } from './features/admin/pages/Drivers';
import { Pricing } from './features/admin/pages/Pricing';
import { Notifications } from './features/admin/pages/Notifications';
import { AIPredictions } from './features/admin/pages/AIPredictions';
import { Reports } from './features/admin/pages/Reports';
import { UserManagement } from './features/admin/pages/UserManagement';
import { UserDetails } from './features/admin/pages/UserDetails';
import { RolesManagement } from './features/admin/pages/RolesManagement';
import { AuditLogs } from './features/admin/pages/AuditLogs';
import { Buses } from './features/admin/pages/Buses';
import { Schedules } from './features/admin/pages/Schedules';
import { CreateSchedule } from './features/admin/pages/CreateSchedule';
import { KeyHandovers } from './features/admin/pages/KeyHandovers';
import { BusRouteAssignments } from './features/admin/pages/BusRouteAssignments';
import { CreateBusRouteAssignment } from './features/admin/pages/CreateBusRouteAssignment';
import { BusDriverAssignments } from './features/admin/pages/BusDriverAssignments';
import { Shifts } from './features/admin/pages/Shifts';
import { Terminals } from './features/admin/pages/Terminals';
import { TerminalDetails } from './features/admin/pages/TerminalDetails';
import { CreateTerminal } from './features/admin/pages/CreateTerminal';
import { Settings } from './features/admin/pages/Settings';
import { Help } from './features/admin/pages/Help';
import { Documentation } from './features/admin/pages/Documentation';

import DriverTripPage from './features/driver/pages/MyTripPage';
import DriverTripHistory from './features/driver/pages/MyTripHistory';
import DriverProfilePage from './features/driver/pages/ProfilePage';
import DriverIncidentPage from './features/driver/pages/IncidentPage';
import DriverNotificationPage from './features/driver/pages/NotificationPage';
import DriverSettingsPage from './features/driver/pages/SettingsPage';
import DriverRouteMapPage from './features/driver/pages/RouteMapPage';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

function App() {
    return (
        <ThemeProvider>
            <ConfirmProvider>
                <QueryClientProvider client={queryClient}>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/" element={<Navigate to="/login" replace />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/change-password" element={<ChangePassword />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />

                            {/* Driver Protected Routes */}
                            <Route
                                path="/driver"
                                element={
                                    <ProtectedRoute>
                                        <DriverTripPage />
                                    </ProtectedRoute>
                                }
                            />
                            <Route path="/driver/trip-history" element={<ProtectedRoute><DriverTripHistory /></ProtectedRoute>} />
                            <Route path="/driver/profile" element={<ProtectedRoute><DriverProfilePage /></ProtectedRoute>} />
                            <Route path="/driver/incident" element={<ProtectedRoute><DriverIncidentPage /></ProtectedRoute>} />
                            <Route path="/driver/notifications" element={<ProtectedRoute><DriverNotificationPage /></ProtectedRoute>} />
                            <Route path="/driver/settings" element={<ProtectedRoute><DriverSettingsPage /></ProtectedRoute>} />
                            <Route path="/driver/route-map" element={<ProtectedRoute><DriverRouteMapPage /></ProtectedRoute>} />

                            <Route
                                path="/dashboard"
                                element={
                                    <ProtectedRoute>
                                        <Layout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route index element={<Dashboard />} />
                                {/* Operations */}
                                <Route path="trips" element={<Trips />} />
                                <Route path="trips/new" element={<CreateTrip />} />
                                <Route path="trips/:id" element={<TripDetails />} />
                                <Route path="tracking" element={<Tracking />} />
                                <Route path="schedules" element={<Schedules />} />
                                <Route path="schedules/create" element={<CreateSchedule />} />
                                <Route path="schedules/edit" element={<CreateSchedule />} />
                                {/* Fleet */}
                                <Route path="buses" element={<Buses />} />
                                <Route path="incidents" element={<Incidents />} />
                                <Route path="key-handovers" element={<KeyHandovers />} />
                                {/* Assignments */}
                                <Route path="bus-route-assignments" element={<BusRouteAssignments />} />
                                <Route path="bus-route-assignments/create" element={<CreateBusRouteAssignment />} />
                                <Route path="bus-route-assignments/edit" element={<CreateBusRouteAssignment />} />
                                <Route path="bus-driver-assignments" element={<BusDriverAssignments />} />
                                {/* Personnel */}
                                <Route path="drivers" element={<Drivers />} />
                                <Route path="shifts" element={<Shifts />} />
                                {/* Infrastructure */}
                                <Route path="routes" element={<RoutesPage />} />
                                <Route path="routes/:id" element={<RouteDetails />} />
                                <Route path="routes/:id/manage-stops" element={<ManageRouteStops />} />
                                <Route path="stops" element={<Stops />} />
                                <Route path="terminals" element={<Terminals />} />
                                <Route path="terminals/create" element={<CreateTerminal />} />
                                <Route path="terminals/:id" element={<TerminalDetails />} />
                                <Route path="terminals/:id/edit" element={<CreateTerminal />} />
                                {/* Financial */}
                                <Route path="pricing" element={<Pricing />} />
                                {/* AI & Analytics */}
                                <Route path="ai-predictions" element={<AIPredictions />} />
                                <Route path="reports" element={<Reports />} />
                                {/* Administration */}
                                <Route path="users" element={<UserManagement />} />
                                <Route path="users/:id" element={<UserDetails />} />
                                <Route path="roles" element={<RolesManagement />} />
                                <Route path="notifications" element={<Notifications />} />
                                <Route path="audit" element={<AuditLogs />} />
                                <Route path="settings" element={<Settings />} />
                                <Route path="help" element={<Help />} />
                                <Route path="help/documentation" element={<Documentation />} />
                            </Route>
                            <Route path="*" element={<Navigate to="/login" replace />} />
                        </Routes>
                    </BrowserRouter>
                    <Toaster position="top-right" />
                </QueryClientProvider>
            </ConfirmProvider>
        </ThemeProvider>
    );
}

export default App;
