// src/features/driver/pages/MyTripPage.tsx

import React, { useState, useCallback, useEffect, useRef } from 'react';

import { useNavigate } from 'react-router-dom';
import {
  Toast,
  SectionIcon,
  FieldLabel,
  Divider,
  HeaderIconButton,
  QuickActions,
  Button,
  EndTripModal,
  LogoutModal,
  IncidentModal,
  MaintenanceModal,
  HandoverModal,
  HandoverListModal,
} from '../components';
import {
  useDriverProfile,
  useGeolocation,
  useHandovers,
  useTripState,
  useToast,
} from '../hooks';
import {
  DEFAULT_DRIVER,
  ROUTE,
  UPCOMING_TRIPS,
  DISPATCH_PHONE,
  INCIDENT_REASONS,
  MAINTENANCE_TYPES,
  MAINTENANCE_PRIORITIES,
  VEHICLE_CONDITIONS,
} from '../constants';
import { ShiftHandover, IncidentReport } from '../types';
import { getGreeting, getInitials, checkSameLocation, storage } from '../utils';

// ================================================================
// QUICK ACTIONS CONFIG
// ================================================================

const QUICK_ACTIONS = [
  {
    id: "incident",
    label: "Incident",
    bg: "bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/30",
    iconColor: "text-rose-600 dark:text-rose-400",
    icon: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    id: "dispatch",
    label: "Dispatch",
    bg: "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30",
    iconColor: "text-[#12B2E4]",
    icon: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
  },
  {
    id: "maintenance",
    label: "Maintenance",
    bg: "bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:hover:bg-amber-900/30",
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
    label: "Handover",
    bg: "bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30",
    iconColor: "text-purple-600 dark:text-purple-400",
    icon: (
      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    id: "check-handovers",
    label: "Check Keys",
    bg: "bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30",
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
  const { profile } = useDriverProfile();
  const { getCurrentPosition, getLocationString } = useGeolocation();
  const { handovers, createHandover, updateHandoverStatus, getPendingHandovers } = useHandovers();
  const { tripStatus, startTrip, pauseTrip, resumeTrip, endTrip, isIdle, isRunning, isPaused } = useTripState();
  const { toastMsg, showToast } = useToast();

  // ─── State ──────────────────────────────────────────────────────
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showShiftHandoverModal, setShowShiftHandoverModal] = useState(false);
  const [showHandoverListModal, setShowHandoverListModal] = useState(false);

  // Incident form
  const [incidentReason, setIncidentReason] = useState('');
  const [incidentMessage, setIncidentMessage] = useState('');

  // Maintenance form
  const [maintenanceType, setMaintenanceType] = useState('');
  const [maintenanceDescription, setMaintenanceDescription] = useState('');
  const [maintenancePriority, setMaintenancePriority] = useState('medium');

  // Handover form
  const [handoverNotes, setHandoverNotes] = useState('');
  const [handoverDriverName, setHandoverDriverName] = useState('');
  const [handoverVehicleCondition, setHandoverVehicleCondition] = useState('good');

  // ─── Close Profile Menu ────────────────────────────────────────
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
  const callDispatch = useCallback(() => {
    window.location.href = `tel:${DISPATCH_PHONE}`;
  }, []);

  const submitIncident = useCallback(() => {
    if (!incidentReason) {
      showToast('⚠️ Select a reason');
      return;
    }
    if (!incidentMessage) {
      showToast('⚠️ Enter a description');
      return;
    }

    const newIncident: IncidentReport = {
      id: Date.now(),
      type: incidentReason,
      description: incidentMessage,
      time: new Date().toLocaleString(),
      location: getLocationString(),
      status: 'Reported',
    };

    const saved = storage.get<IncidentReport[]>('incidents', []);
    storage.set('incidents', [newIncident, ...saved]);
    window.dispatchEvent(new Event('incidentUpdated'));

    setShowIncidentModal(false);
    setIncidentReason('');
    setIncidentMessage('');
    showToast('✅ Incident reported');
  }, [incidentReason, incidentMessage, getLocationString, showToast]);

  const submitMaintenance = useCallback(() => {
    if (!maintenanceType) {
      showToast('⚠️ Select a type');
      return;
    }
    if (!maintenanceDescription) {
      showToast('⚠️ Enter a description');
      return;
    }

    const newRequest = {
      id: Date.now(),
      type: maintenanceType,
      description: maintenanceDescription,
      priority: maintenancePriority,
      date: new Date().toLocaleString(),
      status: 'Pending',
      vehicle: 'Vehicle #001',
    };

    const saved = storage.get<any[]>('maintenanceRequests', []);
    storage.set('maintenanceRequests', [newRequest, ...saved]);
    window.dispatchEvent(new Event('maintenanceUpdated'));

    setShowMaintenanceModal(false);
    setMaintenanceType('');
    setMaintenanceDescription('');
    setMaintenancePriority('medium');
    showToast('✅ Maintenance requested');
  }, [maintenanceType, maintenanceDescription, maintenancePriority, showToast]);

  // ─── Secure Handover ─────────────────────────────────────────
  const submitShiftHandover = useCallback(async () => {
    if (!handoverDriverName) {
      showToast('⚠️ Enter next driver\'s name');
      return;
    }

    const locationData = await getCurrentPosition();
    const handover: Omit<ShiftHandover, 'id'> = {
      currentDriver: profile.name,
      nextDriver: handoverDriverName,
      vehicleCondition: handoverVehicleCondition,
      notes: handoverNotes,
      date: new Date().toLocaleString(),
      status: 'Pending',
      initiatedBy: profile.name,
      initiatedTime: new Date().toISOString(),
      currentDriverLocation: locationData ? `${locationData.latitude}, ${locationData.longitude}` : 'Unknown',
    };

    createHandover(handover);

    setShowShiftHandoverModal(false);
    setHandoverDriverName('');
    setHandoverNotes('');
    setHandoverVehicleCondition('good');
    showToast(`📋 Handover sent to ${handoverDriverName}. Waiting for acceptance.`);
  }, [handoverDriverName, handoverNotes, handoverVehicleCondition, profile.name, getCurrentPosition, createHandover, showToast]);

  const acceptHandover = useCallback(async (handoverId: number) => {
    const handover = handovers.find(h => h.id === handoverId);
    if (!handover) {
      showToast('⚠️ Handover not found');
      return;
    }

    const locationData = await getCurrentPosition();
    if (!locationData) {
      showToast('⚠️ Please enable GPS to accept');
      return;
    }

    const locationStr = `${locationData.latitude}, ${locationData.longitude}`;
    const sameLocation = checkSameLocation(handover.currentDriverLocation || '', locationStr);
    if (!sameLocation) {
      showToast('⚠️ You must be at the same location');
      return;
    }

    updateHandoverStatus(handoverId, 'Completed');
    setShowHandoverListModal(false);
    showToast('✅ Keys transferred successfully!');
  }, [handovers, getCurrentPosition, updateHandoverStatus, showToast]);

  const rejectHandover = useCallback((handoverId: number) => {
    updateHandoverStatus(handoverId, 'Rejected');
    setShowHandoverListModal(false);
    showToast('❌ Handover rejected');
  }, [updateHandoverStatus, showToast]);

  // ─── End Trip Handler ─────────────────────────────────────────
  const handleEndTrip = useCallback(() => {
    endTrip(showToast);
    setShowEndTripModal(false);
  }, [endTrip, showToast]);

  // ─── Derived Values ──────────────────────────────────────────
  const driverName = profile.name || DEFAULT_DRIVER.name;
  const driverInitials = getInitials(driverName);
  const greeting = getGreeting();
  const pendingHandovers = getPendingHandovers(driverName);

  // ─── Render Header ───────────────────────────────────────────
  const renderHeader = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 sm:px-6 py-4 sm:py-6 mb-3 sm:mb-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-0.5">{greeting}</p>
          <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white truncate">{driverName}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              4 trips today
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <HeaderIconButton onClick={goToRouteMap} label="Map" icon={
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          } />
          <HeaderIconButton onClick={goToTripHistory} label="History" icon={
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3" />
            </svg>
          } />
          <HeaderIconButton onClick={goToNotifications} label="Alerts" badge={pendingHandovers.length > 0} icon={
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          } />
          <div className="relative" ref={profileRef}>
            <div className="flex flex-col items-center gap-0.5">
              <button type="button" onClick={() => setShowProfileMenu(v => !v)} className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-[#12B2E4] hover:bg-[#0e9ed4] transition-all shadow-sm flex items-center justify-center touch-manipulation">
                <img src={profile.avatar || "/default-avatar.png"} alt={driverName} className="w-full h-full object-cover" onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                  const parent = target.parentElement;
                  if (parent) {
                    const fallback = document.createElement("span");
                    fallback.className = "text-white font-bold text-xs sm:text-sm";
                    fallback.textContent = driverInitials;
                    parent.appendChild(fallback);
                  }
                }} />
              </button>
              <span className="text-[6px] sm:text-[8px] text-gray-500 dark:text-gray-400 font-medium">Profile</span>
            </div>
            {showProfileMenu && (
              <div className="absolute right-0 top-10 sm:top-12 bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-48 sm:w-56 py-2 z-50 border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-top-2 duration-150">
                <button onClick={goToProfile} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg> View profile
                </button>
                <button onClick={goToSettings} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <svg className="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg> Settings
                </button>
                <div className="h-px bg-gray-100 dark:bg-gray-700 my-1" />
                <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Render Trip Control ─────────────────────────────────────
  const renderTripControl = () => {
    if (isIdle) {
      return (
        <button onClick={startTrip} className="w-full py-3 sm:py-3.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base font-semibold shadow-md shadow-green-200 dark:shadow-green-900/30 hover:shadow-lg active:scale-[0.99] transition-all flex items-center justify-center gap-2 mb-3 sm:mb-4 touch-manipulation">
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Start Trip
        </button>
      );
    }

    if (isRunning) {
      return (
        <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
          <button onClick={pauseTrip} className="flex-1 py-3 sm:py-3.5 rounded-2xl bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-sm sm:text-base font-semibold active:scale-[0.99] transition-all flex items-center justify-center gap-2 touch-manipulation">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg> Pause
          </button>
          <button onClick={() => setShowEndTripModal(true)} className="flex-1 py-3 sm:py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm sm:text-base font-semibold shadow-md shadow-rose-200 dark:shadow-rose-900/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 touch-manipulation">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg> End Trip
          </button>
        </div>
      );
    }

    if (isPaused) {
      return (
        <div className="flex gap-2 sm:gap-3 mb-3 sm:mb-4">
          <button onClick={resumeTrip} className="flex-1 py-3 sm:py-3.5 rounded-2xl bg-green-600 hover:bg-green-700 text-white text-sm sm:text-base font-semibold shadow-md shadow-green-200 dark:shadow-green-900/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 touch-manipulation">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            </svg> Resume
          </button>
          <button onClick={() => setShowEndTripModal(true)} className="flex-1 py-3 sm:py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm sm:text-base font-semibold shadow-md shadow-rose-200 dark:shadow-rose-900/30 active:scale-[0.99] transition-all flex items-center justify-center gap-2 touch-manipulation">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg> End Trip
          </button>
        </div>
      );
    }
    return null;
  };

  // ─── Render Current Trip ─────────────────────────────────────
  const renderCurrentTrip = () => {
    const statusMeta = {
      label: tripStatus === 'idle' ? 'Not started' : tripStatus === 'running' ? 'Running' : 'Paused',
      progress: tripStatus === 'idle' ? 0 : 45,
    };
    return (
      <>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <SectionIcon>
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </SectionIcon>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Current Trip</h3>
          <span className="ml-auto text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">{statusMeta.label}</span>
        </div>
        <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 sm:h-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[#12B2E4] to-[#2B4B9E] transition-all duration-700 ease-out" style={{ width: `${statusMeta.progress}%` }} />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-3 sm:mt-4">
          <FieldLabel label="Route" value={`${ROUTE.start} → ${ROUTE.destination}`} />
          <FieldLabel label="Distance" value={ROUTE.distance} />
          <FieldLabel label="Stops" value={`${ROUTE.stops} stops`} />
          <div>
            <p className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">GPS</p>
            <p className="text-xs sm:text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Active
            </p>
          </div>
        </div>
      </>
    );
  };

  // ─── Render Route Details ────────────────────────────────────
  const renderRouteDetails = () => (
    <>
      <Divider />
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <SectionIcon>
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </SectionIcon>
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Route Details</h3>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Start</p>
          <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{ROUTE.start}</p>
        </div>
        <div className="text-center px-2">
          <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
        <div>
          <p className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider">Destination</p>
          <p className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">{ROUTE.destination}</p>
        </div>
      </div>
      <div className="mt-3 sm:mt-4 text-center">
        <button onClick={goToRouteMapWithNavigation} className="text-[#12B2E4] hover:text-[#0e9ed4] text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1.5 touch-manipulation">
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg> Start Navigation
        </button>
      </div>
    </>
  );

  // ─── Render Upcoming Trips ──────────────────────────────────
  const renderUpcomingTrips = () => (
    <>
      <Divider />
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        <SectionIcon>
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </SectionIcon>
        <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">Upcoming Trips</h3>
        <span className="ml-auto text-[10px] sm:text-xs text-gray-400 dark:text-gray-500">{UPCOMING_TRIPS.length} trips</span>
      </div>
      <div className="space-y-2 sm:space-y-3">
        {UPCOMING_TRIPS.map((trip) => (
          <div key={trip.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 sm:p-4 border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{trip.route}</p>
              <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">{trip.status}</span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">📅 {trip.date} • {trip.time} • {trip.distance}</p>
          </div>
        ))}
      </div>
    </>
  );

  // ─── Render Main Card ────────────────────────────────────────
  const renderMainCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
      {renderCurrentTrip()}
      {renderRouteDetails()}
      {renderUpcomingTrips()}
      <QuickActions actions={QUICK_ACTIONS.map((action) => ({
        ...action,
        onClick: () => {
          switch (action.id) {
            case "incident": setShowIncidentModal(true); break;
            case "dispatch": callDispatch(); break;
            case "maintenance": setShowMaintenanceModal(true); break;
            case "shift-handover": setShowShiftHandoverModal(true); break;
            case "check-handovers": setShowHandoverListModal(true); break;
            default: break;
          }
        },
      }))} />
    </div>
  );

  // ─── Main Render ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12 sm:pb-16">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 pt-3 sm:pt-6">
        {renderHeader()}
        {renderTripControl()}
        {renderMainCard()}

        {/* ─── Modals ────────────────────────────────────────────── */}
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

        <IncidentModal
          isOpen={showIncidentModal}
          onClose={() => setShowIncidentModal(false)}
          onSubmit={submitIncident}
          reason={incidentReason}
          setReason={setIncidentReason}
          message={incidentMessage}
          setMessage={setIncidentMessage}
          location={getLocationString()}
          reasons={INCIDENT_REASONS}
        />

        <MaintenanceModal
          isOpen={showMaintenanceModal}
          onClose={() => setShowMaintenanceModal(false)}
          onSubmit={submitMaintenance}
          type={maintenanceType}
          setType={setMaintenanceType}
          description={maintenanceDescription}
          setDescription={setMaintenanceDescription}
          priority={maintenancePriority}
          setPriority={setMaintenancePriority}
          types={MAINTENANCE_TYPES}
          priorities={[...MAINTENANCE_PRIORITIES]}
          driverName={driverName}
        />

        <HandoverModal
          isOpen={showShiftHandoverModal}
          onClose={() => setShowShiftHandoverModal(false)}
          onSubmit={submitShiftHandover}
          currentDriver={driverName}
          nextDriver={handoverDriverName}
          setNextDriver={setHandoverDriverName}
          vehicleCondition={handoverVehicleCondition}
          setVehicleCondition={setHandoverVehicleCondition}
          notes={handoverNotes}
          setNotes={setHandoverNotes}
          conditions={[...VEHICLE_CONDITIONS]}
        />

        <HandoverListModal
          isOpen={showHandoverListModal}
          handovers={handovers}
          onAccept={acceptHandover}
          onReject={rejectHandover}
          onClose={() => setShowHandoverListModal(false)}
          currentDriverName={driverName}
        />

        <Toast message={toastMsg} />
      </div>
    </div>
  );
};

export default MyTripPage;