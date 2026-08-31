// src/features/driver/pages/MyTripPage.tsx

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Toast,
  SectionIcon,
  FieldLabel,
  Divider,
  HeaderIconButton,
} from '../components';
import {
  EndTripModal,
  LogoutModal,
  MaintenanceModal,
  HandoverModal,
  HandoverListModal,
} from '../components/modals';
import {
  useDriverProfile,
  useGeolocation,
  useTripState,
  useToast,
} from '../hooks';
import { useDriverData } from '../hooks/useDriverData';
import {
  DEFAULT_DRIVER,
  DISPATCH_PHONE,
  INCIDENT_REASONS,
  MAINTENANCE_TYPES,
  MAINTENANCE_PRIORITIES,
  VEHICLE_CONDITIONS,
} from '../constants';
import { ShiftHandover } from '../types';
import { getGreeting, getInitials, checkSameLocation, storage } from '../utils';
import { incidentsApi } from '../services/api/incidents';
import { handoversApi } from '../services/api/handovers';
import { tripsApi } from '../services/api/trips';
import { maintenanceApi } from '../services/api/maintenance';
import { authStorage } from '@/lib/auth-storage';

// ================================================================
// QUICK ACTIONS CONFIG
// ================================================================

const QUICK_ACTIONS = [
  {
    id: "incident",
    label: "Report Incident",
    bgColor: "#fff1f2", // rose-50
    hoverColor: "#ffe4e6", // rose-100
    iconColor: "text-rose-600 dark:text-rose-400",
    icon: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    id: "dispatch",
    label: "Contact Dispatcher",
    bgColor: "#eff6ff", // blue-50
    hoverColor: "#dbeafe", // blue-100
    iconColor: "text-[#12B2E4]",
    icon: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  {
    id: "maintenance",
    label: "Vehicle Problem",
    bgColor: "#fffbeb", // amber-50
    hoverColor: "#fef3c7", // amber-100
    iconColor: "text-amber-600 dark:text-amber-400",
    icon: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: "shift-handover",
    label: "Key Handover",
    bgColor: "#faf5ff", // purple-50
    hoverColor: "#f3e8ff", // purple-100
    iconColor: "text-purple-600 dark:text-purple-400",
    icon: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    id: "check-handovers",
    label: "Key Status",
    bgColor: "#eef2ff", // indigo-50
    hoverColor: "#e0e7ff", // indigo-100
    iconColor: "text-indigo-600 dark:text-indigo-400",
    icon: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
      </svg>
    ),
  },
];

// ================================================================
// MAIN COMPONENT
// ================================================================

const MyTripPage: React.FC = () => {
  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);
  const { profile: localProfile } = useDriverProfile();
  const { getCurrentPosition, getLocationString } = useGeolocation();
  const { tripStatus, startTrip, pauseTrip, resumeTrip, endTrip, isIdle, isRunning, isPaused, setTripStatus } = useTripState();
  const { toastMsg, showToast } = useToast();

  const {
    profile: apiProfile,
    currentTrip,
    upcomingTrips,
    loading,
    error
  } = useDriverData();

  // ─── State ──────────────────────────────────────────────────────
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Modal states
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showShiftHandoverModal, setShowShiftHandoverModal] = useState(false);
  const [showHandoverListModal, setShowHandoverListModal] = useState(false);
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [selectedTripModal, setSelectedTripModal] = useState<any | null>(null);

  // ─── Handovers State ──────────────────────────────────────────
  const [handovers, setHandovers] = useState<ShiftHandover[]>([]);
  const [handoversLoading, setHandoversLoading] = useState(false);

  // ─── Incident Form State ──────────────────────────────────────
  const [incidentType, setIncidentType] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [submittingIncident, setSubmittingIncident] = useState(false);
  const [incidentError, setIncidentError] = useState('');

  // ─── Maintenance Form State ──────────────────────────────────
  const [maintenanceType, setMaintenanceType] = useState('');
  const [maintenanceDescription, setMaintenanceDescription] = useState('');
  const [maintenancePriority, setMaintenancePriority] = useState('medium');
  const [submittingMaintenance, setSubmittingMaintenance] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState('');

  // ─── Handover Form State ──────────────────────────────────────
  const [handoverNotes, setHandoverNotes] = useState('');
  const [handoverVehicleCondition, setHandoverVehicleCondition] = useState('good');
  const [submittingHandover, setSubmittingHandover] = useState(false);
  const [handoverError, setHandoverError] = useState('');
  const [nextDriverInfo, setNextDriverInfo] = useState<{ shiftId: string; driverName: string; driverId: string } | null>(null);
  const [loadingNextDriver, setLoadingNextDriver] = useState(false);
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // ─── Derived Values ──────────────────────────────────────────
  const driverName = apiProfile?.user?.fullName ||
    apiProfile?.fullName ||
    localProfile?.name ||
    DEFAULT_DRIVER.name;

  const driverEmail = apiProfile?.user?.email ||
    apiProfile?.email ||
    localProfile?.email ||
    'driver@sbts.com';

  const driverInitials = getInitials(driverName);
  const greeting = getGreeting();

  // ─── Get Driver ID from user object (not legacy 'driverId' key) ────────────
  const driverId = authStorage.getCurrentUserId('driver');
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [busId, setBusId] = useState<string | null>(null);

  // ─── Load Active Trip ──────────────────────────────────────────
  const loadActiveTrip = useCallback(async () => {
    // driverId derived from 'user' object — always available after login
    try {
      const trip = await tripsApi.getCurrentTrip();
      if (trip) {
        setActiveTrip(trip);
        setBusId(trip.bus_id || null);
        // Sync local status if trip is already in_progress or paused
        if (trip.status === 'in_progress' && isIdle) {
          setTripStatus('running');
        } else if (trip.status === 'paused' && isIdle) {
          setTripStatus('paused');
        }
      } else {
        setActiveTrip(null);
        setBusId(null);
      }
    } catch (err) {
      console.warn('Could not load active trip:', err);
      setActiveTrip(null);
      setBusId(null);
    }
  }, [isIdle]);

  useEffect(() => {
    loadActiveTrip();
  }, [loadActiveTrip]);

  // ─── Check if trip is active ──────────────────────────────────
  const hasActiveTrip = !!(activeTrip || currentTrip);

  // ─── Load Handovers ────────────────────────────────────────────
  const loadHandovers = useCallback(async () => {
    setHandoversLoading(true);
    try {
      const data = await handoversApi.getMyHandovers();
      setHandovers(data.map((h: any) => ({
        id: h.id,
        currentDriver: h.fromShift?.driver?.fullName || h.currentDriver || 'Unknown',
        nextDriver: h.toShift?.driver?.fullName || h.nextDriver || 'Unknown',
        vehicleCondition: h.vehicleCondition || 'good',
        notes: h.notes || '',
        date: h.handoverTime ? new Date(h.handoverTime).toLocaleString() : new Date().toLocaleString(),
        status: h.status === 'confirmed' ? 'Completed'
          : h.status === 'cancelled' ? 'Rejected'
            : 'Pending',
        initiatedBy: h.fromShift?.driver?.fullName || '',
        initiatedTime: h.handoverTime || new Date().toISOString(),
        currentDriverLocation: h.currentDriverLocation || '',
      })));
    } catch (err) {
      console.error('Failed to load handovers:', err);
    } finally {
      setHandoversLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHandovers();
  }, [loadHandovers]);
  // src/features/driver/pages/MyTripPage.tsx

  // Add this after other useEffect hooks (around line 150-170)

  // ─── Listen for profile updates from other components ─────────
  useEffect(() => {
    const handleProfileUpdate = () => {
      console.log('🔄 Profile updated, refreshing dashboard...');
      // Reload the page to reflect changes
      window.location.reload();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, []);
  // Add this after the existing useEffects (around line 150-170)

  // ─── Listen for profile updates ──────────────────────────────────
  useEffect(() => {
    const handleProfileUpdate = () => {
      console.log('🔄 Profile updated, refreshing dashboard...');
      // Reload the page to reflect changes
      window.location.reload();
    };

    window.addEventListener('profileUpdated', handleProfileUpdate);
    window.addEventListener('storage', handleProfileUpdate);

    return () => {
      window.removeEventListener('profileUpdated', handleProfileUpdate);
      window.removeEventListener('storage', handleProfileUpdate);
    };
  }, []);
  // ─── Trip Data ──────────────────────────────────────────────────
  const calculateProgress = (): number => {
    if (!currentTrip) return 0;
    if ((currentTrip as any).progress) return (currentTrip as any).progress;
    if ((currentTrip as any).completionPercentage) return (currentTrip as any).completionPercentage;
    const totalStops = currentTrip.stops || 1;
    const completedStops = (currentTrip as any).completedStops || 0;
    return Math.min(Math.round((completedStops / totalStops) * 100), 100);
  };

  const progress = calculateProgress();

  const tripToDisplay = activeTrip || currentTrip;
  const routeObj = (tripToDisplay as any)?.version?.route || (tripToDisplay as any)?.route;
  const direction = (tripToDisplay as any)?.version?.direction || 'forward';

  const originTerminal = (tripToDisplay as any)?.version?.origin || (typeof routeObj === 'object' ? (routeObj as any)?.origin || (routeObj as any)?.startLocation : null) || tripToDisplay?.startStop || 'Start Terminal';
  const destTerminal = (tripToDisplay as any)?.version?.destination || (typeof routeObj === 'object' ? (routeObj as any)?.destination || (routeObj as any)?.endLocation : null) || tripToDisplay?.endStop || 'End Terminal';

  const displayRoute = (typeof routeObj === 'object' ? (routeObj as any)?.routeName : routeObj) || tripToDisplay?.route || 'Route 101';
  const displayDistance = tripToDisplay?.distance || '14.2 km';
  const displayStops = tripToDisplay?.stops ? `${tripToDisplay.stops} stops` : '5 stops';
  const displayStart = tripToDisplay?.startStop || (tripToDisplay as any)?.start || originTerminal;
  const displayDestination = tripToDisplay?.endStop || (tripToDisplay as any)?.end || destTerminal;

  const pendingHandovers = handovers.filter(h =>
    h.status?.toLowerCase() === 'pending'
  );

  // ─── Close Profile Menu ──────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Navigation ──────────────────────────────────────────────
  const goToRouteMap = useCallback(() => {
    navigate('/driver/route-map');
    showToast('🗺️ Opening map');
  }, [navigate, showToast]);

  const goToRouteMapWithNavigation = useCallback(() => {
    navigate('/driver/route-map', { state: { startNavigation: true } });
    showToast('🗺️ Starting navigation');
  }, [navigate, showToast]);

  const goToTripHistory = useCallback(() => {
    navigate('/driver/trip-history');
  }, [navigate]);

  const goToNotifications = useCallback(() => {
    navigate('/driver/notifications');
  }, [navigate]);

  const goToProfile = useCallback(() => {
    setShowProfileMenu(false);
    navigate('/driver/profile');
  }, [navigate]);

  const goToSettings = useCallback(() => {
    setShowProfileMenu(false);
    navigate('/driver/settings');
  }, [navigate]);

  const handleLogout = useCallback(() => {
    setShowProfileMenu(false);
    setShowLogoutModal(true);
  }, []);

  const confirmLogout = useCallback(() => {
    setShowLogoutModal(false);
    navigate('/login');
  }, [navigate]);

  // ─── Quick Actions ───────────────────────────────────────────
  // Replaced with dispatch modal trigger

  // ─── Submit Incident ──────────────────────────────────────────
  const submitIncident = useCallback(async () => {
    if (!incidentType) {
      setIncidentError('Please select an incident type');
      return;
    }
    if (!incidentDescription) {
      setIncidentError('Please enter a description');
      return;
    }

    if (!hasActiveTrip) {
      setIncidentError('Please start a trip before reporting an incident.');
      return;
    }

    setIncidentError('');
    setSubmittingIncident(true);

    try {
      let latitude = 9.03;
      let longitude = 38.74;

      try {
        const pos = await getCurrentPosition();
        if (pos) {
          latitude = pos.latitude;
          longitude = pos.longitude;
        }
      } catch (posErr) {
        console.warn('Could not get GPS position, using default:', posErr);
      }

      const tripToUse = activeTrip || currentTrip;
      if (!tripToUse || !tripToUse.id) {
        setIncidentError('No active trip found. Please start a trip first.');
        setSubmittingIncident(false);
        return;
      }

      const payload = {
        tripId: tripToUse.id,
        incidentType: incidentType,
        description: incidentDescription,
        severity: incidentSeverity,
        latitude: latitude,
        longitude: longitude,
      };

      console.log('📤 Submitting incident with payload:', JSON.stringify(payload, null, 2));
      console.log('📤 Trip being used:', tripToUse);
      const response = await incidentsApi.create(payload);
      console.log('✅ Incident created successfully:', response);

      setShowIncidentModal(false);
      setIncidentType('');
      setIncidentDescription('');
      setIncidentSeverity('medium');
      setIncidentError('');
      showToast('✅ Incident reported successfully');
    } catch (err: any) {
      console.error('❌ Error submitting incident:', err);
      if (err.response?.data?.message) {
        setIncidentError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorMessages = Object.values(errors).flat().join(', ');
        setIncidentError(errorMessages);
      } else {
        setIncidentError(err.message || 'Failed to submit incident');
      }
    } finally {
      setSubmittingIncident(false);
    }
  }, [incidentType, incidentDescription, incidentSeverity, hasActiveTrip, activeTrip, currentTrip, getCurrentPosition, showToast]);

  // ─── Submit Maintenance ──────────────────────────────────────
  const submitMaintenance = useCallback(async () => {
    if (!maintenanceType) {
      setMaintenanceError('Please select a maintenance type');
      return;
    }
    if (!maintenanceDescription) {
      setMaintenanceError('Please enter a description');
      return;
    }

    if (!hasActiveTrip) {
      setMaintenanceError('Please start a trip before requesting maintenance.');
      return;
    }

    setMaintenanceError('');
    setSubmittingMaintenance(true);

    try {
      let latitude = 9.03;
      let longitude = 38.74;

      try {
        const pos = await getCurrentPosition();
        if (pos) {
          latitude = pos.latitude;
          longitude = pos.longitude;
        }
      } catch (posErr) {
        console.warn('Could not get GPS position, using default:', posErr);
      }

      // Map priority to severity
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      if (maintenancePriority === 'urgent') severity = 'critical';
      else if (maintenancePriority === 'high') severity = 'high';
      else if (maintenancePriority === 'low') severity = 'low';

      const tripToUse = activeTrip || currentTrip;
      if (!tripToUse || !tripToUse.id) {
        setMaintenanceError('No active trip found. Please start a trip first.');
        setSubmittingMaintenance(false);
        return;
      }

      const payload = {
        tripId: tripToUse.id,
        incidentType: `Maintenance: ${maintenanceType}`,
        description: maintenanceDescription,
        severity: severity,
        latitude: latitude,
        longitude: longitude,
      };

      console.log('📤 Submitting maintenance as incident:', JSON.stringify(payload, null, 2));
      const response = await incidentsApi.create(payload);
      console.log('✅ Maintenance created successfully:', response);

      setShowMaintenanceModal(false);
      setMaintenanceType('');
      setMaintenanceDescription('');
      setMaintenancePriority('medium');
      setMaintenanceError('');
      showToast('✅ Maintenance requested successfully');
    } catch (err: any) {
      console.error('❌ Error submitting maintenance:', err);
      if (err.response?.data?.message) {
        setMaintenanceError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorMessages = Object.values(errors).flat().join(', ');
        setMaintenanceError(errorMessages);
      } else {
        setMaintenanceError(err.message || 'Failed to submit maintenance request');
      }
    } finally {
      setSubmittingMaintenance(false);
    }
  }, [maintenanceType, maintenanceDescription, maintenancePriority, hasActiveTrip, activeTrip, getCurrentPosition, showToast]);

  // ─── Submit Shift Handover ────────────────────────────────────
  const submitShiftHandover = useCallback(async () => {
    if (!nextDriverInfo) {
      setHandoverError('No next driver found for this bus. Contact admin to assign the next shift.');
      return;
    }
    if (!hasActiveTrip) {
      setHandoverError('Please start a trip before creating a handover.');
      return;
    }

    setHandoverError('');
    setSubmittingHandover(true);
    const tripBusId = activeTrip?.bus_id || busId;
    const fromShiftId = activeTrip?.shiftId;

    try {
      await handoversApi.create({
        busId: tripBusId || '',
        fromShiftId: fromShiftId,
        toShiftId: nextDriverInfo.shiftId,
        handoverTime: new Date().toISOString(),
        notes: `Vehicle condition: ${handoverVehicleCondition}. ${handoverNotes || ''}`.trim(),
      });

      setShowShiftHandoverModal(false);
      setHandoverNotes('');
      setHandoverVehicleCondition('good');
      setHandoverError('');
      setNextDriverInfo(null);
      showToast(`📋 Handover sent to ${nextDriverInfo.driverName}. Waiting for acceptance.`);
      loadHandovers();
    } catch (err: any) {
      console.error('Failed to submit handover:', err);
      setHandoverError(err.response?.data?.message || err.message || 'Failed to submit handover');
    } finally {
      setSubmittingHandover(false);
    }
  }, [nextDriverInfo, handoverNotes, handoverVehicleCondition, hasActiveTrip, activeTrip, busId, showToast, loadHandovers]);

  // ─── Accept Handover ──────────────────────────────────────────
  const acceptHandover = useCallback(async (handoverId: string | number) => {
    try {
      await handoversApi.accept(String(handoverId));
      setHandovers(prev => prev.map(h => String(h.id) === String(handoverId) ? { ...h, status: 'Completed' } : h));
      setShowHandoverListModal(false);
      showToast('✅ Keys received! You can now start your shift.');
      loadHandovers();
    } catch (err: any) {
      showToast(`❌ ${err.response?.data?.message || err.message || 'Failed to accept handover'}`);
    }
  }, [showToast, loadHandovers]);

  // ─── Reject Handover ──────────────────────────────────────────
  const rejectHandover = useCallback(async (handoverId: string | number) => {
    try {
      await handoversApi.reject(String(handoverId));
      setHandovers(prev => prev.map(h => String(h.id) === String(handoverId) ? { ...h, status: 'Rejected' } : h));
      setShowHandoverListModal(false);
      showToast('❌ Handover rejected.');
      loadHandovers();
    } catch (err: any) {
      showToast(`❌ ${err.response?.data?.message || err.message || 'Failed to reject handover'}`);
    }
  }, [showToast, loadHandovers]);

  // ─── End Trip Handler ─────────────────────────────────────────
  const handleEndTrip = useCallback(async () => {
    try {
      const tripId = activeTrip?.id || currentTrip?.id;
      if (tripId) {
        await endTrip(tripId, showToast);
      }
      setShowEndTripModal(false);
    } catch (err: any) {
      console.error('Failed to end trip:', err);
      showToast(`❌ ${err.message || 'Failed to end trip'}`);
    }
  }, [activeTrip, currentTrip, endTrip, showToast]);

  const currentTripData = (activeTrip || currentTrip || upcomingTrips?.[0]) as any;
  const busPlate = currentTripData?.bus?.plateNumber || currentTripData?.bus || currentTripData?.busPlateNumber || 'AA-3-4001';
  const shiftHours = currentTripData?.shift ? `${currentTripData.shift.shiftStart || '06:00'} – ${currentTripData.shift.shiftEnd || '14:00'}` : '06:00 – 14:00';
  const hasPendingHandover = handovers.some(h => String(h.status).toLowerCase() === 'pending');

  const renderHeader = () => (
    <div className="relative w-full z-30 mb-6 lg:mb-8">
      {/* Decorative premium header with exact #2B4B9E color */}
      <div className="bg-[#2B4B9E] rounded-[2.5rem] px-6 lg:px-12 py-8 lg:py-10 shadow-[0_20px_40px_-15px_rgba(43,75,158,0.4)] relative text-white w-full border border-white/10">
        <div className="absolute inset-0 rounded-[2.5rem] overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold mb-1.5 tracking-[0.2em] text-cyan-200 uppercase drop-shadow-sm flex items-center gap-2">
              <span className="w-5 h-px bg-cyan-300/50"></span>
              {greeting}
            </p>
            <h1 className="text-3xl lg:text-5xl font-black truncate tracking-tight drop-shadow-md mb-4">{driverName}</h1>

            {/* On Duty Status Bar */}
            <div className="inline-flex flex-wrap items-center gap-3 bg-white/10 backdrop-blur-xl px-5 py-2.5 rounded-2xl border border-white/15 shadow-inner">
              <span className="inline-flex items-center gap-2 text-xs lg:text-sm font-extrabold text-emerald-300 uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-4 ring-emerald-400/30" />
                On Duty
              </span>
              <span className="text-white/40 font-bold">•</span>
              <span className="text-xs lg:text-sm font-bold text-white/90">
                Shift: <span className="text-white font-black">{shiftHours}</span>
              </span>
              <span className="text-white/40 font-bold">•</span>
              <span className="text-xs lg:text-sm font-bold text-white/90">
                Bus: <span className="text-cyan-200 font-mono font-black">{busPlate}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4 flex-shrink-0">
            <div className="hidden md:flex gap-3">
              <button onClick={goToRouteMap} className="bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-sm px-5 py-2.5 rounded-2xl transition-all hover:-translate-y-0.5 shadow-lg flex items-center gap-2 backdrop-blur-md">
                <svg className="w-4 h-4 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
                Route Map
              </button>
              <button onClick={goToTripHistory} className="bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-sm px-5 py-2.5 rounded-2xl transition-all hover:-translate-y-0.5 shadow-lg flex items-center gap-2 backdrop-blur-md">
                <svg className="w-4 h-4 text-cyan-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Activity
              </button>
              <button onClick={goToNotifications} className="bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-sm px-4 py-2.5 rounded-2xl transition-all shadow-lg hover:scale-105 active:scale-95 flex items-center gap-2 backdrop-blur-md relative">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Notifications
                {pendingHandovers.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-blue-500 animate-pulse" />
                )}
              </button>
            </div>

            <div className="relative group cursor-pointer ml-2">
              <div onClick={() => setShowProfileMenu(v => !v)} className={`w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-white/50 shadow-xl flex items-center justify-center bg-white/20 backdrop-blur-sm transition-transform active:scale-95 ${showProfileMenu ? 'ring-4 ring-white/30' : ''}`}>
                <img src={localProfile?.avatar || "/default-avatar.png"} alt={driverName} className="w-full h-full object-cover" onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement("span");
                    fallback.className = "text-white font-black text-xl";
                    fallback.textContent = driverInitials;
                    parent.appendChild(fallback);
                  }
                }} />
              </div>

              {/* Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-56 py-3 z-50 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white">
                  <div className="px-5 pb-3 mb-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{driverEmail}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Driver Account</p>
                  </div>
                  <button onClick={goToProfile} className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <svg className="w-4 h-4 text-[#2B4B9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    View Profile
                  </button>
                  <button onClick={goToSettings} className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <svg className="w-4 h-4 text-[#2B4B9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Settings
                  </button>
                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-2" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTripControl = () => {
    const handleAction = async (actionFn: (id: string) => Promise<void>) => {
      const id = activeTrip?.id || currentTrip?.id;
      if (id) {
        try {
          await actionFn(id);
        } catch (error) {
          showToast(`❌ Failed to update trip status`);
        }
      } else {
        showToast(`❌ No active trip found`);
      }
    };

    if (isIdle) {
      return (
        <button onClick={() => handleAction(startTrip)} className="w-full py-5 lg:py-6 rounded-3xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-lg lg:text-xl font-extrabold shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 active:scale-[0.98] transition-all flex items-center justify-center gap-4 touch-manipulation border border-emerald-400/20">
          <svg className="w-7 h-7 lg:w-8 lg:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          START DRIVING
        </button>
      );
    }

    if (isRunning) {
      return (
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={() => handleAction(pauseTrip)} className="flex-1 py-5 rounded-3xl bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 border-2 border-amber-200 dark:border-amber-800 text-sm font-bold active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1 touch-manipulation">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-[12px] uppercase tracking-widest mt-1">Pause</span>
          </button>
          <button onClick={() => setShowEndTripModal(true)} className="flex-[2] py-5 rounded-3xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white text-lg font-extrabold shadow-xl shadow-rose-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 touch-manipulation border border-rose-400/20">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 10h6m-6 4h6" />
            </svg>
            END TRIP
          </button>
        </div>
      );
    }

    if (isPaused) {
      return (
        <div className="flex gap-3">
          <button onClick={() => handleAction(resumeTrip)} className="flex-[2] py-5 rounded-3xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white text-lg font-extrabold shadow-xl shadow-emerald-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3 touch-manipulation border border-emerald-400/20">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg>
            RESUME TRIP
          </button>
          <button onClick={() => setShowEndTripModal(true)} className="flex-1 py-5 rounded-3xl bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-700 dark:text-rose-400 border-2 border-rose-200 dark:border-rose-800 text-sm font-bold active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-1 touch-manipulation">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span className="text-[12px] uppercase tracking-widest mt-1">End</span>
          </button>
        </div>
      );
    }
    return null;
  };

  const renderCurrentTrip = () => {
    const tripToUse = activeTrip || currentTrip || (upcomingTrips && upcomingTrips[0]);
    const routeName = (typeof tripToUse?.version?.route === 'object' ? tripToUse?.version?.route?.routeName : null) || tripToUse?.route?.routeName || tripToUse?.route || 'Route 101';
    const directionStr = tripToUse?.startStop && tripToUse?.endStop ? `${tripToUse.startStop} → ${tripToUse.endStop}` : (tripToUse?.version?.direction === 'backward' ? 'Backward' : 'Forward');
    const departureTime = tripToUse?.scheduledStart ? new Date(tripToUse.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : (tripToUse?.time || '06:00');
    const stopCount = tripToUse?.stops || (tripToUse?.version?.routeStops?.length) || 5;

    const keyHandedOver = !hasPendingHandover;
    const isReadyToStart = keyHandedOver && isIdle;

    const handleStartClick = async () => {
      const id = tripToUse?.id || tripToUse?.tripId || (upcomingTrips && upcomingTrips[0]?.id);
      if (id) {
        try {
          await startTrip(id);
          showToast('🚌 Trip started! Have a safe drive.');
          loadActiveTrip();
        } catch (err: any) {
          console.error('Failed to start trip:', err);
          showToast(`❌ Failed to start trip: ${err.message || 'Error'}`);
        }
      } else {
        showToast('❌ No assigned trip found for this shift.');
      }
    };

    if (isIdle) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 lg:p-8 shadow-xl shadow-gray-200/40 dark:shadow-black/30 border border-gray-100 dark:border-gray-700/60 relative overflow-hidden flex flex-col h-full col-span-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#2B4B9E]/10 flex items-center justify-center text-[#2B4B9E] font-black">
                🚌
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">CURRENT TRIP</h3>
                <p className="text-xs font-bold text-gray-400">Assigned for current shift</p>
              </div>
            </div>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${keyHandedOver ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}>
              <span className={`w-2 h-2 rounded-full ${keyHandedOver ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {keyHandedOver ? 'Status: READY' : 'Status: WAITING FOR KEY'}
            </span>
          </div>

          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Route</p>
              <p className="text-lg font-black text-gray-900 dark:text-white">{routeName}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{directionStr}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Scheduled Departure</p>
              <p className="text-lg font-black text-[#2B4B9E] dark:text-cyan-400">{departureTime}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Stops: {stopCount}</p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Assigned Bus</p>
              <p className="text-lg font-black text-gray-900 dark:text-white font-mono">{busPlate}</p>
              <p className="text-xs text-emerald-600 font-bold">Assigned to driver</p>
            </div>

            <div className={`p-4 rounded-2xl border ${keyHandedOver ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
              }`}>
              <p className="text-[11px] font-bold uppercase tracking-wider mb-1 text-gray-500">Key Handover</p>
              {keyHandedOver ? (
                <div>
                  <p className="text-base font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <span className="text-lg">✓</span> Handed Over
                  </p>
                  <p className="text-xs text-emerald-600/80 font-medium">Ready to drive</p>
                </div>
              ) : (
                <div>
                  <p className="text-base font-black text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                    <span className="text-lg">🔑</span> Waiting for handover
                  </p>
                  <p className="text-xs text-amber-600/80 font-medium">Check keys to accept</p>
                </div>
              )}
            </div>
          </div>

          {/* Start Trip Button */}
          <button
            onClick={handleStartClick}
            disabled={!isReadyToStart}
            className={`w-full py-5 rounded-2xl font-black text-lg uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-3 ${isReadyToStart
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white shadow-emerald-500/30 hover:scale-[1.01] active:scale-[0.99]'
              : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-600'
              }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            START TRIP
          </button>
          {!keyHandedOver && (
            <p className="text-center text-xs font-semibold text-amber-500 mt-2">
              🔑 Key handover from previous driver must be confirmed before starting trip.
            </p>
          )}
        </div>
      );
    }

    // In-Progress or Paused State
    const startTimeStr = tripToUse?.actualStart ? new Date(tripToUse.actualStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : departureTime;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 lg:p-8 shadow-xl shadow-gray-200/40 dark:shadow-black/30 border border-gray-100 dark:border-gray-700/60 relative overflow-hidden flex flex-col h-full col-span-2 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight uppercase">CURRENT TRIP</h3>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-50 text-blue-600 border border-blue-200">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
                {isRunning ? '● IN PROGRESS' : 'PAUSED'}
              </span>
            </div>
            <p className="text-lg font-black text-gray-800 dark:text-gray-100">{routeName} — <span className="text-[#2B4B9E] dark:text-cyan-400">{directionStr}</span></p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-gray-400 uppercase">Started</p>
            <p className="text-base font-black text-gray-900 dark:text-white font-mono">{startTimeStr}</p>
          </div>
        </div>

        {/* Live Trip Progress Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50/60 dark:bg-blue-950/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
            <p className="text-[11px] font-bold text-blue-500 uppercase tracking-wider mb-1">Current Stop</p>
            <p className="text-lg font-black text-blue-900 dark:text-blue-200">{activeTrip?.routeStopNames?.[0] || 'Mercato'}</p>
          </div>
          <div className="bg-slate-50 dark:bg-gray-700/40 p-4 rounded-2xl border border-slate-200 dark:border-gray-600">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Next Stop</p>
            <p className="text-lg font-black text-gray-900 dark:text-white">{activeTrip?.routeStopNames?.[1] || 'Piassa'}</p>
          </div>
          <div className="bg-emerald-50/60 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
            <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">ETA</p>
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-300">{activeTrip?.duration || '18 min'}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={goToRouteMapWithNavigation}
            className="flex-1 py-4 px-6 rounded-2xl bg-[#2B4B9E] hover:bg-[#1f3775] text-white font-black text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all"
          >
            <svg className="w-5 h-5 text-cyan-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            VIEW ROUTE MAP
          </button>
          <button
            onClick={() => setShowEndTripModal(true)}
            className="flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 10h6m-6 4h6" />
            </svg>
            END TRIP
          </button>
        </div>
      </div>
    );
  };

  const renderRouteDetails = () => (
    <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 lg:p-8 shadow-xl shadow-gray-200/40 dark:shadow-black/30 border border-gray-100 dark:border-gray-700/60 text-center flex flex-col lg:flex-row lg:items-center col-span-2 gap-6">
      <div className="w-full lg:w-2/3 flex items-center justify-between gap-4">
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl flex-1 border border-gray-100 dark:border-gray-700/50 p-5 flex flex-col justify-center text-left">
          <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-1">Start Terminal</p>
          <p className="text-base font-bold text-gray-900 dark:text-white truncate">{displayStart}</p>
        </div>
        <div className="bg-blue-50 dark:bg-gray-700 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-[#2B4B9E] dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-2xl flex-1 border border-gray-100 dark:border-gray-700/50 p-5 flex flex-col justify-center text-left">
          <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold mb-1">Destination Terminal</p>
          <p className="text-base font-bold text-gray-900 dark:text-white truncate">{displayDestination}</p>
        </div>
      </div>

      <button onClick={goToRouteMapWithNavigation} className="w-full lg:w-1/3 px-6 py-4 bg-gray-900 dark:bg-gray-700 hover:bg-black dark:hover:bg-gray-600 text-white rounded-2xl text-sm font-bold shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
        <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
        Launch Navigation Map
      </button>
    </div>
  );

  const renderUpcomingTrips = () => {
    const tripToUse = activeTrip || currentTrip;
    const activeRouteName = (typeof tripToUse?.version?.route === 'object' ? tripToUse?.version?.route?.routeName : null) || tripToUse?.route?.routeName || tripToUse?.route || 'Route 101';
    const activeDirection = tripToUse?.startStop && tripToUse?.endStop ? `${tripToUse.startStop} → ${tripToUse.endStop}` : (tripToUse?.version?.direction === 'backward' ? 'Backward' : 'Forward');

    const defaultTodayTrips = [
      { id: activeTrip?.id || '1', time: '06:00', route: activeRouteName, direction: activeDirection, status: isRunning ? 'In Progress' : 'Scheduled', icon: isRunning ? '●' : '○', statusBg: isRunning ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-emerald-600 bg-emerald-50 border-emerald-200', raw: activeTrip || { route: activeRouteName, direction: activeDirection, time: '06:00' } },
    ];

    const displayList = upcomingTrips && upcomingTrips.length > 0 ? upcomingTrips.slice(0, 5).map((t: any, idx: number) => {
      const isCompleted = t.status === 'completed';
      const isCurrent = t.status === 'in_progress' || (idx === 0 && isRunning);
      const timeStr = t.scheduledStart ? new Date(t.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : (t.time || '06:00');
      const rName = (typeof t.version?.route === 'object' ? t.version?.route?.routeName : null) || t.route?.routeName || t.route || activeRouteName;
      const dirStr = t.startStop && t.endStop ? `${t.startStop} → ${t.endStop}` : activeDirection;
      const statusLabel = isCompleted ? 'Completed' : (isCurrent ? 'Current' : 'Scheduled');
      const icon = isCompleted ? '✓' : (isCurrent ? '●' : '○');
      const statusBg = isCompleted ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : isCurrent ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-gray-600 bg-gray-50 border-gray-200';
      return { id: t.id || String(idx), time: timeStr, route: rName, direction: dirStr, status: statusLabel, icon, statusBg, raw: t };
    }) : defaultTodayTrips;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 lg:p-8 shadow-xl shadow-gray-200/40 dark:shadow-black/30 border border-gray-100 dark:border-gray-700/60">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-[#2B4B9E] dark:text-cyan-400 font-black">
              🗓️
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight uppercase">TODAY'S TRIPS</h3>
          </div>
          <span className="text-xs font-bold text-gray-400 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">{displayList.length} scheduled</span>
        </div>

        <div className="space-y-3">
          {displayList.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTripModal(t.raw)}
              className="bg-gray-50 hover:bg-blue-50/50 dark:bg-gray-700/30 dark:hover:bg-gray-700/60 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/50 flex items-center justify-between cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-black text-[#2B4B9E] dark:text-cyan-400 w-6 text-center">{t.icon}</span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-gray-500">{t.time}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white group-hover:text-[#2B4B9E] transition-colors">{t.route}</span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t.direction}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border ${t.statusBg}`}>
                  {t.status}
                </span>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-[#2B4B9E] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderQuickActions = () => (
    <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 lg:p-8 shadow-xl shadow-gray-200/40 dark:shadow-black/30 border border-gray-100 dark:border-gray-700/60">
      <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 tracking-tight flex flex-wrap items-center gap-2">
        Quick Actions
        {!hasActiveTrip && (
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 rounded-full">
            Start a trip first
          </span>
        )}
      </h3>
      <div className="grid grid-cols-5 gap-2">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => {
              console.log('🔘 Quick action clicked:', action.id);
              switch (action.id) {
                case "incident":
                  console.log('🚨 Opening incident modal');
                  setShowIncidentModal(true);
                  break;
                case "dispatch":
                  console.log('📞 Opening dispatch modal');
                  setShowDispatchModal(true);
                  break;
                case "maintenance":
                  console.log('🔧 Opening maintenance modal');
                  setShowMaintenanceModal(true);
                  break;
                case "shift-handover": {
                  // Open modal and auto-fetch next driver from backend
                  setShowShiftHandoverModal(true);
                  const currentBusId = activeTrip?.bus_id || busId;
                  const currentShiftId = activeTrip?.shiftId;
                  if (currentBusId) {
                    setLoadingNextDriver(true);
                    handoversApi.getNextDriver(currentBusId, currentShiftId)
                      .then((info) => {
                        if (info) {
                          setNextDriverInfo({ shiftId: info.shiftId, driverName: info.driverName, driverId: info.driverId });
                        } else {
                          setNextDriverInfo(null);
                        }
                      })
                      .catch(() => setNextDriverInfo(null))
                      .finally(() => setLoadingNextDriver(false));
                  }
                  break;
                }
                case "check-handovers": setShowHandoverListModal(true); break;
                default: break;
              }
            }}
            className={`flex flex-col items-center justify-center gap-2 p-4 lg:p-5 rounded-[1.25rem] ${action.bg} transition-all hover:scale-[1.03] active:scale-[0.97] w-full touch-manipulation focus:outline-none`}
          >
            <span className={`${action.iconColor} transform scale-125 mb-1.5`}>{action.icon}</span>
            <span className="text-[10px] lg:text-xs font-bold text-gray-700 dark:text-gray-300 text-center leading-tight">
              {action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  // MAIN RENDER OMITTED FROM THIS CHUNK

  // ─── Modals ──────────────────────────────────────────────────
  const renderIncidentModal = () => {
    if (!showIncidentModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md px-0 sm:px-4 animate-in fade-in duration-300">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 border-t border-gray-100 dark:border-gray-700">
          <div className="bg-gradient-to-br from-[#12B2E4] to-[#2B4B9E] p-6 text-white relative">
            <button
              onClick={() => {
                setShowIncidentModal(false);
                setIncidentType('');
                setIncidentDescription('');
                setIncidentError('');
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white text-xl backdrop-blur-md"
            >
              ×
            </button>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-4 shadow-inner backdrop-blur-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-1">Report Incident</h3>
            <p className="text-white/80 text-sm">Please provide accurate details for dispatch.</p>
          </div>

          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {!hasActiveTrip && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-medium">Action Required:</p>
                  <p>Please start a trip before reporting an incident.</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Incident Type <span className="text-red-500">*</span>
              </label>
              <select
                value={incidentType}
                onChange={(e) => {
                  setIncidentType(e.target.value);
                  setIncidentError('');
                }}
                disabled={!hasActiveTrip || submittingIncident}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-[#12B2E4] focus:border-transparent outline-none transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select incident type</option>
                {INCIDENT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>{reason}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Severity <span className="text-red-500">*</span>
              </label>
              <select
                value={incidentSeverity}
                onChange={(e) => setIncidentSeverity(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
                disabled={!hasActiveTrip || submittingIncident}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-[#12B2E4] focus:border-transparent outline-none transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="low">🟢 Low - Minor issue, no immediate action needed</option>
                <option value="medium">🟡 Medium - Requires attention soon</option>
                <option value="high">🟠 High - Urgent, requires immediate attention</option>
                <option value="critical">🔴 Critical - Emergency, safety risk</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Location
              </label>
              <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-600 dark:text-gray-400 font-mono">
                {getLocationString() || 'Fetching GPS...'}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={incidentDescription}
                onChange={(e) => {
                  setIncidentDescription(e.target.value);
                  setIncidentError('');
                }}
                placeholder="Describe what happened..."
                rows={4}
                disabled={!hasActiveTrip || submittingIncident}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-[#12B2E4] focus:border-transparent outline-none transition-shadow resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {incidentError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-medium">Error:</p>
                  <p>{incidentError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer with action buttons */}
          <div className="p-6 pt-0">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowIncidentModal(false);
                  setIncidentType('');
                  setIncidentDescription('');
                  setIncidentSeverity('medium');
                  setIncidentError('');
                }}
                disabled={submittingIncident}
                className="flex-1 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={submitIncident}
                disabled={!hasActiveTrip || submittingIncident}
                className="flex-1 py-3 text-sm font-semibold text-white bg-[#2B4B9E] hover:bg-[#12B2E4] rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingIncident ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Report'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderMaintenanceModal = () => {
    if (!showMaintenanceModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md px-0 sm:px-4 animate-in fade-in duration-300">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 border-t border-gray-100 dark:border-gray-700">
          <div className="bg-gradient-to-br from-[#12B2E4] to-[#2B4B9E] p-6 text-white relative">
            <button
              onClick={() => {
                setShowMaintenanceModal(false);
                setMaintenanceType('');
                setMaintenanceDescription('');
                setMaintenanceError('');
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white text-xl backdrop-blur-md"
            >
              ×
            </button>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-4 shadow-inner backdrop-blur-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-1">Request Maintenance</h3>
            <p className="text-white/80 text-sm">Submit a defect report for your vehicle.</p>
          </div>

          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {!hasActiveTrip && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-medium">Action Required:</p>
                  <p>Please start a trip before requesting maintenance.</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Maintenance Type <span className="text-red-500">*</span>
              </label>
              <select
                value={maintenanceType}
                onChange={(e) => {
                  setMaintenanceType(e.target.value);
                  setMaintenanceError('');
                }}
                disabled={!hasActiveTrip || submittingMaintenance}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-[#12B2E4] focus:border-transparent outline-none transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Select maintenance type</option>
                {MAINTENANCE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Priority Level
              </label>
              <select
                value={maintenancePriority}
                onChange={(e) => setMaintenancePriority(e.target.value)}
                disabled={!hasActiveTrip || submittingMaintenance}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-[#12B2E4] focus:border-transparent outline-none transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={maintenanceDescription}
                onChange={(e) => {
                  setMaintenanceDescription(e.target.value);
                  setMaintenanceError('');
                }}
                placeholder="Describe the maintenance issue..."
                rows={3}
                disabled={!hasActiveTrip || submittingMaintenance}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-[#12B2E4] focus:border-transparent outline-none transition-shadow resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {maintenanceError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-medium">Error:</p>
                  <p>{maintenanceError}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer with action buttons */}
          <div className="p-6 pt-0">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowMaintenanceModal(false);
                  setMaintenanceType('');
                  setMaintenanceDescription('');
                  setMaintenanceError('');
                }}
                disabled={submittingMaintenance}
                className="flex-1 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={submitMaintenance}
                disabled={!hasActiveTrip || submittingMaintenance}
                className="flex-1 py-3 text-sm font-semibold text-white bg-[#2B4B9E] hover:bg-[#12B2E4] rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submittingMaintenance ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Submitting...
                  </>
                ) : (
                  'Submit Request'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHandoverModal = () => {
    if (!showShiftHandoverModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md px-0 sm:px-4 animate-in fade-in duration-300">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 border-t border-gray-100 dark:border-gray-700">
          <div className="bg-gradient-to-br from-[#12B2E4] to-[#2B4B9E] p-6 text-white relative">
            <button
              onClick={() => {
                setShowShiftHandoverModal(false);
                setHandoverNotes('');
                setHandoverVehicleCondition('good');
                setHandoverError('');
                setNextDriverInfo(null);
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white text-xl backdrop-blur-md"
            >
              ×
            </button>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-4 shadow-inner backdrop-blur-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-1">Shift Handover</h3>
            <p className="text-white/80 text-sm">Transfer vehicle keys and report condition.</p>
          </div>

          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
            {!hasActiveTrip && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-medium">Action Required:</p>
                  <p>Please start a trip before creating a handover.</p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Current Driver
              </label>
              <input
                type="text"
                value={driverName}
                disabled
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white bg-gray-50 dark:bg-gray-700 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Next Driver
              </label>
              {loadingNextDriver ? (
                <div className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-500 bg-gray-50 dark:bg-gray-700 flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                  Looking up next driver...
                </div>
              ) : nextDriverInfo ? (
                <div className="w-full border border-green-300 dark:border-green-700 rounded-xl px-4 py-3 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium">{nextDriverInfo.driverName}</span>
                  <span className="text-xs text-green-500 ml-auto">Auto-assigned</span>
                </div>
              ) : (
                <div className="w-full border border-amber-300 dark:border-amber-700 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  No next driver assigned. Contact admin.
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Vehicle Condition
              </label>
              <select
                value={handoverVehicleCondition}
                onChange={(e) => setHandoverVehicleCondition(e.target.value)}
                disabled={!hasActiveTrip || submittingHandover}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-[#12B2E4] focus:border-transparent outline-none transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {VEHICLE_CONDITIONS.map((condition) => (
                  <option key={condition} value={condition}>
                    {condition.charAt(0).toUpperCase() + condition.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Handover Notes
              </label>
              <textarea
                value={handoverNotes}
                onChange={(e) => {
                  setHandoverNotes(e.target.value);
                  setHandoverError('');
                }}
                placeholder="Any important information for the next driver..."
                rows={3}
                disabled={!hasActiveTrip || submittingHandover}
                className="w-full border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-[#12B2E4] focus:border-transparent outline-none transition-shadow resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {handoverError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <p className="font-medium">Error:</p>
                  <p>{handoverError}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setShowShiftHandoverModal(false);
                setHandoverNotes('');
                setHandoverVehicleCondition('good');
                setHandoverError('');
                setNextDriverInfo(null);
              }}
              disabled={submittingHandover}
              className="flex-1 py-3 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={submitShiftHandover}
              disabled={!hasActiveTrip || submittingHandover}
              className="flex-1 py-3 text-sm font-semibold text-white bg-[#2B4B9E] hover:bg-[#12B2E4] rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submittingHandover ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                'Complete Handover'
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDispatchModal = () => {
    if (!showDispatchModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md px-0 sm:px-4 animate-in fade-in duration-300">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-t-[2rem] sm:rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-300 border-t border-gray-100 dark:border-gray-700">
          <div className="bg-gradient-to-br from-[#12B2E4] to-[#2B4B9E] p-6 text-white relative">
            <button
              onClick={() => setShowDispatchModal(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors text-white text-xl backdrop-blur-md"
            >
              ×
            </button>
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center text-white mb-4 shadow-inner backdrop-blur-sm">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-1">Contact Dispatch</h3>
            <p className="text-white/80 text-sm">Get in touch with the control room immediately.</p>
          </div>

          <div className="p-6 space-y-4">
            <button
              onClick={() => {
                setShowDispatchModal(false);
                window.location.href = `tel:${DISPATCH_PHONE}`;
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group focus:outline-none focus:ring-2 focus:ring-[#12B2E4]"
            >
              <div className="w-12 h-12 rounded-full bg-[#12B2E4]/10 dark:bg-[#12B2E4]/20 flex items-center justify-center text-[#12B2E4]">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-[#12B2E4] transition-colors">Call Control Room</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Direct voice call to {DISPATCH_PHONE}</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#12B2E4] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => {
                setShowDispatchModal(false);
                setShowIncidentModal(true);
              }}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors group focus:outline-none focus:ring-2 focus:ring-rose-500"
            >
              <div className="w-12 h-12 rounded-full bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center text-rose-500">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="text-left flex-1">
                <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-rose-500 transition-colors">Report Emergency</h4>
                <p className="text-xs text-gray-500 dark:text-gray-400">Send an immediate SOS to dispatch</p>
              </div>
              <svg className="w-5 h-5 text-gray-400 group-hover:text-rose-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => setShowDispatchModal(false)}
              className="w-full mt-2 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTripDetailsModal = () => {
    if (!selectedTripModal) return null;
    const t = selectedTripModal;
    const routeName = (typeof t.version?.route === 'object' ? t.version?.route?.routeName : null) || t.route?.routeName || t.route || 'Assigned Route';
    const directionStr = t.startStop && t.endStop ? `${t.startStop} → ${t.endStop}` : (t.version?.direction === 'backward' ? 'Backward' : 'Forward');
    const busPlate = t.bus?.plateNumber || t.bus || 'AA-3-4001';
    const departureTime = t.scheduledStart ? new Date(t.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : (t.time || '06:00');

    // Extract sequential stops from DB model
    const routeStopsArr = t.version?.routeStops || t.version?.route?.stops || t.routeStops || [];
    const stopsList = routeStopsArr.length > 0
      ? routeStopsArr.map((s: any, idx: number) => ({
        step: idx + 1,
        name: s.stop?.name || s.name || `Stop ${idx + 1}`,
        code: s.stop?.code || s.code || `STP-${idx + 1}`,
      }))
      : (t.routeStopNames && t.routeStopNames.length > 0
        ? t.routeStopNames.map((name: string, idx: number) => ({ step: idx + 1, name, code: `STP-${idx + 1}` }))
        : [
          { step: 1, name: t.startStop || 'Megenagna Terminal', code: 'TRM-01' },
          { step: 2, name: 'Bole Terminal', code: 'STP-02' },
          { step: 3, name: 'Mexico Square', code: 'STP-03' },
          { step: 4, name: 'Sarish Terminal', code: 'STP-04' },
          { step: 5, name: t.endStop || 'Kality Terminal', code: 'TRM-05' },
        ]
      );

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 mb-6">
            <div>
              <span className="text-xs font-black tracking-widest text-[#2B4B9E] dark:text-cyan-400 uppercase">Assigned Trip Details</span>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{routeName}</h2>
              <p className="text-xs font-bold text-gray-500">{directionStr}</p>
            </div>
            <button
              onClick={() => setSelectedTripModal(null)}
              className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3.5 rounded-2xl border border-blue-100 dark:border-blue-800">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Departure</p>
              <p className="text-base font-black text-[#2B4B9E] dark:text-cyan-400">{departureTime}</p>
            </div>
            <div className="bg-purple-50/60 dark:bg-purple-950/30 p-3.5 rounded-2xl border border-purple-100 dark:border-purple-800">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Assigned Bus</p>
              <p className="text-base font-black text-purple-700 dark:text-purple-300 font-mono">{t.bus?.plateNumber || t.bus || 'AA-3-4001'}</p>
            </div>
            <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-800 col-span-2 sm:col-span-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase">Status</p>
              <p className="text-base font-black text-emerald-600 dark:text-emerald-400 uppercase">{t.status || 'Scheduled'}</p>
            </div>
          </div>

          {/* Sequential Stops Timeline */}
          <div className="mb-6">
            <h4 className="text-xs font-black uppercase text-gray-400 tracking-wider mb-3">Assigned Route Stops ({stopsList.length})</h4>
            <div className="space-y-3 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
              {stopsList.map((stop: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#2B4B9E] text-white font-black text-xs flex items-center justify-center shrink-0">
                    {stop.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{stop.name}</p>
                    <p className="text-[10px] font-mono text-gray-400">{stop.code}</p>
                  </div>
                  {idx === 0 && <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-100 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">START</span>}
                  {idx === stopsList.length - 1 && <span className="text-[10px] font-extrabold text-rose-600 bg-rose-100 dark:bg-rose-950/50 px-2 py-0.5 rounded-full">END</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setSelectedTripModal(null);
                goToRouteMapWithNavigation();
              }}
              className="flex-1 py-3.5 px-4 bg-gray-900 dark:bg-gray-700 hover:bg-black text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              🗺️ View Route Map
            </button>
            <button
              onClick={async () => {
                try {
                  const id = t.id || t.tripId;
                  if (id) {
                    await startTrip(id);
                    setSelectedTripModal(null);
                    showToast('🚌 Trip started successfully!');
                    loadActiveTrip();
                  } else {
                    showToast('❌ Invalid trip ID');
                  }
                } catch (err: any) {
                  showToast(`❌ Failed to start: ${err.message || 'Error'}`);
                }
              }}
              className="flex-1 py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-green-500 transition-all flex items-center justify-center gap-2"
            >
              ▶ Start Trip
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Main Render ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-gray-900 pb-12 sm:pb-16 font-sans">
      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 pt-6 sm:pt-8 w-full">
        {renderHeader()}

        {/* ─── Pending Handover Banner (Driver B sees this) ─── */}
        {handovers.filter(h => String(h.status).toLowerCase() === 'pending').length > 0 && (
          <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
            <button
              onClick={() => setShowHandoverListModal(true)}
              className="w-full flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 text-left hover:from-indigo-400 hover:to-purple-500 transition-all group active:scale-[0.99]"
            >
              <span className="relative flex-shrink-0">
                <span className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </span>
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center text-[10px] font-black text-yellow-900 animate-bounce">
                  {handovers.filter(h => String(h.status).toLowerCase() === 'pending').length}
                </span>
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white">Key Handover Pending!</p>
                <p className="text-xs text-white/80 truncate">
                  {handovers.find(h => String(h.status).toLowerCase() === 'pending')?.currentDriver} is waiting to transfer the vehicle keys to you.
                </p>
              </div>
              <svg className="w-5 h-5 text-white/70 group-hover:text-white transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8 items-start mt-6 lg:mt-8">
          <div className="xl:col-span-2 space-y-6 lg:space-y-8 flex flex-col h-full">
            {renderCurrentTrip()}
            {renderRouteDetails()}
          </div>
          <div className="space-y-6 lg:space-y-8">
            {renderUpcomingTrips()}
            {renderQuickActions()}
          </div>
        </div>

        <EndTripModal
          isOpen={showEndTripModal}
          onClose={() => setShowEndTripModal(false)}
          onConfirm={handleEndTrip}
        />

        <LogoutModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={confirmLogout}
        />

        <HandoverListModal
          isOpen={showHandoverListModal}
          handovers={handovers}
          onAccept={acceptHandover}
          onReject={rejectHandover}
          onClose={() => setShowHandoverListModal(false)}
          currentDriverName={driverName}
          loading={handoversLoading}
        />

        {renderIncidentModal()}
        {renderMaintenanceModal()}
        {renderHandoverModal()}
        {renderDispatchModal()}
        {renderTripDetailsModal()}

        <Toast message={toastMsg} />
      </div>
    </div>
  );
};

export default MyTripPage;