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
    id: 'incident',
    label: 'Report Incident',
    tint: '#DB8A2C',
    bg: '#FEF6EC',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.3 3.6L2.7 17a1.8 1.8 0 0 0 1.5 2.7h15.6a1.8 1.8 0 0 0 1.5-2.7L13.7 3.6a1.8 1.8 0 0 0-3.4 0z" />
        <path d="M12 9v4" />
        <path d="M12 16.5h.01" />
      </svg>
    ),
  },
  {
    id: 'dispatch',
    label: 'Contact Dispatch',
    tint: '#2B6BE0',
    bg: '#EEF3FE',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .7 3a2 2 0 0 1-.4 2.1L8 10.1a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c1 .3 2 .6 3 .7a2 2 0 0 1 1.6 2z" />
      </svg>
    ),
  },
  {
    id: 'maintenance',
    label: 'Vehicle Problem',
    tint: '#C2410C',
    bg: '#FEF3EC',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a4 4 0 0 1 5.7 5.7l-3 3a4 4 0 0 1-5.7 0" />
        <path d="M9.3 17.7a4 4 0 0 1-5.7-5.7l3-3a4 4 0 0 1 5.7 0" />
      </svg>
    ),
  },
  {
    id: 'shift-handover',
    label: 'Key Handover',
    tint: '#7C3AED',
    bg: '#F5F1FD',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 2l4 4-4 4" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" />
        <path d="M7 22l-4-4 4-4" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    ),
  },
  {
    id: 'check-handovers',
    label: 'Key Status',
    tint: '#0B1739',
    bg: '#EEF0F7',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="15" r="4" />
        <path d="M10.5 12.5L19 4" />
        <path d="M16 8l2 2" />
        <path d="M19 5l2 2" />
      </svg>
    ),
  },
];

// ================================================================
// SHARED MODAL SHELL
// ================================================================

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  busy?: boolean;
}

const ModalShell: React.FC<ModalShellProps> = ({ isOpen, onClose, icon, title, subtitle, children, footer, busy }) => {
  if (!isOpen) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#0B1739]/55 backdrop-blur-sm px-0 sm:px-4 animate-in fade-in duration-200"
      onClick={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}
    >
      <div className="w-full sm:max-w-md max-h-[92dvh] sm:max-h-[85vh] bg-white rounded-t-[1.75rem] sm:rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        <div className="sm:hidden flex justify-center pt-2.5 pb-1 shrink-0">
          <div className="w-9 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="px-5 sm:px-6 pt-3 sm:pt-6 pb-4 sm:pb-5 shrink-0 relative border-b border-[#EEF0F7]">
          <button
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="absolute top-3 right-4 sm:top-5 sm:right-5 w-8 h-8 rounded-full bg-[#F1F3F8] hover:bg-[#E5E9F3] flex items-center justify-center transition-colors text-[#5B6478] disabled:opacity-40"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" viewBox="0 0 24 24"><path d="M6 6l12 12M6 18L18 6" /></svg>
          </button>
          <div className="flex items-center gap-3 pr-10">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#12B2E4] to-[#2B4B9E] flex items-center justify-center text-white shrink-0 shadow-[0_8px_16px_-8px_rgba(43,75,158,0.6)]">
              <span className="w-5 h-5 sm:w-[22px] sm:h-[22px]">{icon}</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-['Space_Grotesk',sans-serif] text-[17px] sm:text-[19px] font-bold text-[#101832] leading-tight truncate">{title}</h3>
              {subtitle && <p className="text-[12.5px] sm:text-[13px] text-[#9AA2B6] mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-6 py-4 sm:py-5 space-y-4 overflow-y-auto grow">
          {children}
        </div>

        {footer && (
          <div className="px-5 sm:px-6 py-3.5 sm:py-4 border-t border-[#EEF0F7] shrink-0 bg-white pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

const InlineNotice: React.FC<{ tone: 'warning' | 'error'; title: string; message: string }> = ({ tone, title, message }) => {
  const styles = tone === 'warning'
    ? 'bg-amber-50 border-amber-200 text-amber-700'
    : 'bg-red-50 border-red-200 text-red-600';
  return (
    <div className={`p-3 rounded-xl border flex items-start gap-2.5 text-[13px] ${styles}`}>
      <svg className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="mt-0.5 leading-snug">{message}</p>
      </div>
    </div>
  );
};

const fieldClass = "w-full border border-[#E5E9F3] rounded-xl px-3.5 py-2.5 sm:py-3 text-[13.5px] text-[#1B2340] bg-white focus:ring-2 focus:ring-[#12B2E4]/40 focus:border-[#12B2E4] outline-none transition-shadow disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-[#B4BACB]";
const labelClass = "block text-[12.5px] font-semibold text-[#5B6478] mb-1.5";

const PrimaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }> = ({ loading, children, className = '', ...rest }) => (
  <button
    {...rest}
    className={`w-full py-3 rounded-xl text-[13.5px] font-semibold text-white bg-gradient-to-r from-[#2B4B9E] to-[#12B2E4] hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100 ${className}`}
  >
    {loading && (
      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
      </svg>
    )}
    {children}
  </button>
);

const SecondaryButton: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ children, className = '', ...rest }) => (
  <button
    {...rest}
    className={`py-3 px-4 rounded-xl text-[13.5px] font-semibold text-[#5B6478] bg-[#F1F3F8] hover:bg-[#E5E9F3] active:scale-[0.99] transition-all disabled:opacity-45 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

// ================================================================
// SKELETON PRIMITIVES
// ================================================================

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-[#E9ECF4] rounded-md animate-pulse ${className}`} />
);

const TodayTripsSkeleton: React.FC = () => (
  <div className="bg-white rounded-[16px] sm:rounded-[18px] border border-[#E5E9F3] p-3.5 sm:p-4 lg:p-5 shadow-[0_10px_30px_-18px_rgba(19,35,82,0.25)] flex-1 min-h-0 flex flex-col">
    <div className="flex items-center justify-between mb-2.5 sm:mb-3 shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-4 rounded-[3px] bg-[#12B2E4]" />
        <h3 className="font-['Space_Grotesk',sans-serif] font-semibold text-[14px] sm:text-[15.5px]">Today's trips</h3>
      </div>
      <SkeletonBlock className="w-16 h-3.5" />
    </div>

    <div className="flex flex-col gap-1.5 sm:gap-2 min-h-0">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-[11px] sm:rounded-[12px] border border-[#E5E9F3] shrink-0">
          <SkeletonBlock className="w-10 sm:w-11 h-3.5 shrink-0" />
          <div className="flex-1 min-w-0 space-y-1.5">
            <SkeletonBlock className="h-3.5 w-2/3" />
            <SkeletonBlock className="h-2.5 w-2/5" />
          </div>
          <SkeletonBlock className="w-14 h-5 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  </div>
);

const CurrentTripSkeleton: React.FC = () => (
  <div className="bg-white rounded-[16px] sm:rounded-[18px] border border-[#E5E9F3] p-3.5 sm:p-4 lg:p-5 shadow-[0_10px_30px_-18px_rgba(19,35,82,0.25)] flex flex-col h-full min-h-0">
    <div className="flex items-center justify-between mb-2.5 sm:mb-3 pb-2 sm:pb-2.5 border-b border-[#E5E9F3] shrink-0">
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-4 rounded-[3px] bg-[#12B2E4]" />
        <h3 className="font-['Space_Grotesk',sans-serif] font-semibold text-[14px] sm:text-[15.5px]">Current trip</h3>
      </div>
      <SkeletonBlock className="w-20 h-6 rounded-full" />
    </div>

    <div className="mb-4 sm:mb-5 shrink-0 space-y-2">
      <SkeletonBlock className="h-4.5 w-3/4" />
      <SkeletonBlock className="h-3 w-2/5" />
    </div>

    <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mb-3 sm:mb-4 shrink-0">
      <div className="bg-[#F6F8FC] border border-[#E5E9F3] rounded-[11px] sm:rounded-[12px] p-2.5 sm:p-3 space-y-1.5">
        <SkeletonBlock className="h-2.5 w-8" />
        <SkeletonBlock className="h-4 w-12" />
      </div>
      <div className="bg-[#F6F8FC] border border-[#E5E9F3] rounded-[11px] sm:rounded-[12px] p-2.5 sm:p-3 space-y-1.5">
        <SkeletonBlock className="h-2.5 w-12" />
        <SkeletonBlock className="h-4 w-12" />
      </div>
    </div>

    <div className="flex-1 min-h-2" />

    <SkeletonBlock className="w-full h-11 rounded-[11px] sm:rounded-[12px]" />
  </div>
);

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

  // ─── NEW: Selected trip for preview ──────────────────────────
  const [selectedTrip, setSelectedTrip] = useState<any | null>(null);

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

  // ─── Get Driver ID ────────────────────────────────────────────
  const driverId = authStorage.getCurrentUserId('driver');
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [busId, setBusId] = useState<string | null>(null);

  // ─── Load Active Trip ──────────────────────────────────────────
  const loadActiveTrip = useCallback(async () => {
    try {
      const trip = await tripsApi.getCurrentTrip();
      if (trip) {
        setActiveTrip(trip);
        setBusId(trip.bus_id || null);
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

  // ─── Listen for profile updates ──────────────────────────────────
  useEffect(() => {
    const handleProfileUpdate = () => {
      console.log('🔄 Profile updated, refreshing dashboard...');
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

  // ─── Dynamic ETA ────────────────────────────────────────────────
  const calculateETA = (trip: any): string => {
    if (!trip) return '-- min';

    const explicitEta = trip.etaMinutes ?? trip.eta;
    if (typeof explicitEta === 'number') return `${explicitEta} min`;
    if (typeof explicitEta === 'string' && explicitEta.trim()) return explicitEta;

    const totalDuration = trip.estimatedDuration || trip.duration || trip.version?.estimatedDuration;
    if (typeof totalDuration === 'number' && totalDuration > 0) {
      const remaining = Math.max(Math.round(totalDuration * (1 - progress / 100)), 0);
      return `${remaining} min`;
    }

    if (trip.scheduledEnd) {
      const end = new Date(trip.scheduledEnd).getTime();
      if (!Number.isNaN(end)) {
        const diffMin = Math.max(Math.round((end - Date.now()) / 60000), 0);
        return `${diffMin} min`;
      }
    }

    return '-- min';
  };

  // ─── Get the trip to display (selectedTrip > activeTrip > currentTrip) ──
  const getTripToDisplay = () => {
    if (selectedTrip) return selectedTrip;
    return activeTrip || currentTrip;
  };

  const tripToDisplay = getTripToDisplay();
  const routeObj = (tripToDisplay as any)?.version?.route || (tripToDisplay as any)?.route;

  const originTerminal = (tripToDisplay as any)?.version?.origin || 
    (typeof routeObj === 'object' ? (routeObj as any)?.origin || (routeObj as any)?.startLocation : null) || 
    tripToDisplay?.startStop || 
    '';

  const destTerminal = (tripToDisplay as any)?.version?.destination || 
    (typeof routeObj === 'object' ? (routeObj as any)?.destination || (routeObj as any)?.endLocation : null) || 
    tripToDisplay?.endStop || 
    '';

  const viaRoute = (tripToDisplay as any)?.version?.route?.via || 
    (tripToDisplay as any)?.via || 
    '';

  const displayRoute = (typeof routeObj === 'object' ? (routeObj as any)?.routeName : routeObj) || 
    tripToDisplay?.route || 
    '';

  const displayDistance = tripToDisplay?.distance || '';

  const displayStart = tripToDisplay?.startStop || 
    (tripToDisplay as any)?.start || 
    originTerminal || 
    '';

  const displayDestination = tripToDisplay?.endStop || 
    (tripToDisplay as any)?.end || 
    destTerminal || 
    '';

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

  // ─── NEW: Handle trip selection from list ─────────────────────
  const handleTripSelect = (trip: any) => {
    setSelectedTrip(trip);
    if (trip?.route) {
      showToast(`📋 ${trip.route} selected`);
    }
  };

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
  const busPlate = currentTripData?.bus?.plateNumber || 
    currentTripData?.bus || 
    currentTripData?.busPlateNumber || 
    '';

  const shiftHours = currentTripData?.shift ? 
    `${currentTripData.shift.shiftStart || ''} – ${currentTripData.shift.shiftEnd || ''}` : 
    '';

  const hasPendingHandover = handovers.some(h => String(h.status).toLowerCase() === 'pending');

  // ─── Render Functions ──────────────────────────────────────────

  const renderHeader = () => (
    <header className="shrink-0 bg-gradient-to-r from-[#0B1739] via-[#12204A] to-[#2B4B9E] rounded-[16px] sm:rounded-[20px] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-7 flex flex-wrap items-center justify-between text-white relative">
      <div className="absolute inset-0 rounded-[16px] sm:rounded-[20px] overflow-hidden pointer-events-none">
        <div className="absolute right-[-60px] top-[-90px] w-[200px] h-[200px] lg:w-[260px] lg:h-[260px] rounded-full bg-[rgba(18,178,228,0.28)]" />
      </div>

      <div className="relative z-10 flex-1 min-w-[180px]">
        <p className="text-[12px] sm:text-[13.5px] font-medium text-white/65 mb-0.5 sm:mb-1">{greeting}</p>
        <h1 className="font-['Space_Grotesk',sans-serif] text-[20px] sm:text-[23px] lg:text-[26px] font-bold tracking-[-0.02em] mb-2 sm:mb-3">{driverName}</h1>

        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          <div className="flex items-center gap-1.5 bg-white/10 border border-white/14 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[12px] sm:text-[13px] font-medium text-white/92">
            <span className="w-[7px] h-[7px] rounded-full bg-[#3DDC91] shadow-[0_0_0_3px_rgba(61,220,145,0.25)]" />
            On duty
          </div>
          {shiftHours && (
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/14 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[12px] sm:text-[13px] font-medium text-white/92">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[14px] h-[14px]">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 3" />
              </svg>
              {shiftHours}
            </div>
          )}
          {busPlate && (
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/14 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[12px] sm:text-[13px] font-medium text-white/92">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-[14px] h-[14px]">
                <rect x="3" y="6" width="18" height="12" rx="3" />
                <circle cx="7.5" cy="18" r="1.4" fill="currentColor" stroke="none" />
                <circle cx="16.5" cy="18" r="1.4" fill="currentColor" stroke="none" />
              </svg>
              {busPlate}
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2 sm:gap-2.5 mt-3 lg:mt-0">
        <button onClick={goToTripHistory} className="flex items-center gap-1.5 bg-white/8 border border-white/16 text-white px-2.5 py-2 sm:px-3.5 rounded-[11px] text-[13px] sm:text-[13.5px] font-medium hover:bg-white/16 active:scale-95 transition-all">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M3 12h4l2 8 4-16 2 8h6" />
          </svg>
          <span className="hidden md:inline">Activity</span>
        </button>
        <button onClick={goToNotifications} className="relative flex items-center gap-1.5 bg-white/8 border border-white/16 text-white px-2.5 py-2 sm:px-3.5 rounded-[11px] text-[13px] sm:text-[13.5px] font-medium hover:bg-white/16 active:scale-95 transition-all">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>
          <span className="hidden md:inline">Notifications</span>
          {pendingHandovers.length > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-[#2B4B9E] animate-pulse" />
          )}
        </button>

        <div className="relative ml-1" ref={profileRef}>
          <div
            onClick={() => setShowProfileMenu(v => !v)}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#12B2E4] to-[#2B4B9E] flex items-center justify-center font-['Space_Grotesk',sans-serif] font-semibold text-sm border-2 border-white/30 cursor-pointer transition-all ${showProfileMenu ? 'ring-2 ring-white/40' : ''}`}
          >
            {driverInitials}
          </div>

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
    </header>
  );

  const renderCurrentTrip = () => {
    const tripToUse = tripToDisplay || (upcomingTrips && upcomingTrips[0]);
    
    if (!tripToUse) {
      return (
        <div className="bg-white rounded-[16px] sm:rounded-[18px] border border-[#E5E9F3] p-3.5 sm:p-4 lg:p-5 shadow-[0_10px_30px_-18px_rgba(19,35,82,0.25)] flex flex-col h-full min-h-0 items-center justify-center">
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-[#F1F3F8] flex items-center justify-center text-[#9AA2B6] mx-auto mb-3">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="16" rx="3" />
                <path d="M16 3v4M8 3v4M3 10h18" />
              </svg>
            </div>
            <p className="font-['Space_Grotesk',sans-serif] font-semibold text-[15px] text-[#101832]">No trip assigned</p>
            <p className="text-[13px] text-[#9AA2B6] mt-1">Check back later for your next trip</p>
          </div>
        </div>
      );
    }

    const routeName = (typeof tripToUse?.version?.route === 'object' ? tripToUse?.version?.route?.routeName : null) || 
      tripToUse?.route?.routeName || 
      tripToUse?.route || 
      '';

    const departureTime = tripToUse?.scheduledStart ? 
      new Date(tripToUse.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 
      (tripToUse?.time || '');

    const startTimeStr = tripToUse?.actualStart ? 
      new Date(tripToUse.actualStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 
      departureTime;

    const etaDisplay = calculateETA(tripToUse);

    const keyHandedOver = !hasPendingHandover;
    const isReadyToStart = keyHandedOver && isIdle;

    const handleStartClick = async () => {
      const id = tripToUse?.id || tripToUse?.tripId || (upcomingTrips && upcomingTrips[0]?.id);
      if (id) {
        try {
          await startTrip(id);
          showToast('🚌 Trip started! Have a safe drive.');
          loadActiveTrip();
          setSelectedTrip(null);
          goToRouteMapWithNavigation();
        } catch (err: any) {
          console.error('Failed to start trip:', err);
          showToast(`❌ Failed to start trip: ${err.message || 'Error'}`);
        }
      } else {
        showToast('❌ No assigned trip found for this shift.');
      }
    };

    const isSelectedFromList = selectedTrip && tripToUse?.id === selectedTrip.id;

    // For idle state - show "Not started" status
    if (isIdle) {
      return (
        <div className={`bg-white rounded-[16px] sm:rounded-[18px] border p-3.5 sm:p-4 lg:p-5 shadow-[0_10px_30px_-18px_rgba(19,35,82,0.25)] flex flex-col h-full min-h-0 ${isSelectedFromList ? 'border-[#2B4B9E] border-2' : 'border-[#E5E9F3]'}`}>
          <div className="flex items-center justify-between mb-2.5 sm:mb-3 pb-2 sm:pb-2.5 border-b border-[#E5E9F3] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-4 rounded-[3px] bg-[#12B2E4]" />
              <h3 className="font-['Space_Grotesk',sans-serif] font-semibold text-[14px] sm:text-[15.5px]">
                {isSelectedFromList ? 'Selected Trip' : 'Current trip'}
              </h3>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${isSelectedFromList ? 'bg-[#EAF0FE] text-[#2B4B9E]' : 'bg-[#F1F3F8] text-[#5B6478]'}`}>
              {isSelectedFromList ? 'Preview' : 'Not started'}
            </span>
          </div>

          <div className="mb-4 sm:mb-5 shrink-0">
            <div className="font-['Space_Grotesk',sans-serif] font-bold text-[14.5px] sm:text-[16.5px]">
              {originTerminal || displayStart} → {destTerminal || displayDestination}
            </div>
            {viaRoute && (
              <div className="text-[12.5px] sm:text-[13px] text-[#9AA2B6] mt-0.5">via {viaRoute}</div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mb-3 sm:mb-4 shrink-0">
            <div className="bg-[#F6F8FC] border border-[#E5E9F3] rounded-[11px] sm:rounded-[12px] p-2.5 sm:p-3">
              <div className="text-[11px] text-[#9AA2B6] font-medium mb-0.5">ETA</div>
              <div className="font-['Space_Grotesk',sans-serif] font-bold text-[15px] sm:text-[17px]">{etaDisplay}</div>
            </div>
            <div className="bg-[#F6F8FC] border border-[#E5E9F3] rounded-[11px] sm:rounded-[12px] p-2.5 sm:p-3">
              <div className="text-[11px] text-[#9AA2B6] font-medium mb-0.5">Started</div>
              <div className="font-['Space_Grotesk',sans-serif] font-bold text-[15px] sm:text-[17px]">{departureTime}</div>
            </div>
          </div>

          <div className="flex-1 min-h-2" />

          <button
            onClick={handleStartClick}
            disabled={!isReadyToStart}
            className={`w-full py-2.5 sm:py-3 rounded-[11px] sm:rounded-[12px] font-semibold text-[13px] sm:text-[13.5px] flex items-center justify-center gap-2 transition-all shrink-0 active:scale-[0.99] ${
              isReadyToStart
                ? 'bg-gradient-to-r from-[#17A673] to-[#149463] text-white shadow-[0_10px_20px_-10px_rgba(20,148,99,0.6)] hover:opacity-90'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path d="M8 5v14l11-7z" />
            </svg>
            {isReadyToStart ? 'Start trip' : 'Waiting for handover'}
          </button>

          <button
            onClick={goToRouteMapWithNavigation}
            className="w-full mt-2 py-2.5 sm:py-3 rounded-[11px] sm:rounded-[12px] bg-gradient-to-br from-[#12B2E4] to-[#2B4B9E] text-white font-semibold text-[13px] sm:text-[13.5px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all shrink-0"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M3 11l18-8-8 18-2-8-8-2z" />
            </svg>
            Launch navigation map
          </button>

          {!keyHandedOver && (
            <p className="text-center text-xs font-semibold text-amber-500 mt-2 shrink-0">
              🔑 Key handover from previous driver must be confirmed before starting trip.
            </p>
          )}
        </div>
      );
    }

    // In-progress state
    return (
      <div className={`bg-white rounded-[16px] sm:rounded-[18px] border p-3.5 sm:p-4 lg:p-5 shadow-[0_10px_30px_-18px_rgba(19,35,82,0.25)] flex flex-col h-full min-h-0 ${isSelectedFromList ? 'border-[#2B4B9E] border-2' : 'border-[#E5E9F3]'}`}>
        <div className="flex items-center justify-between mb-2.5 sm:mb-3 pb-2 sm:pb-2.5 border-b border-[#E5E9F3] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-4 rounded-[3px] bg-[#12B2E4]" />
            <h3 className="font-['Space_Grotesk',sans-serif] font-semibold text-[14px] sm:text-[15.5px]">
              {isSelectedFromList ? 'Selected Trip' : 'Current trip'}
            </h3>
          </div>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
            isRunning
              ? 'bg-[#E4F6ED] text-[#149463]'
              : 'bg-[#FBEEDF] text-[#DB8A2C]'
          }`}>
            {isRunning ? 'In progress' : 'Paused'}
          </span>
        </div>

        <div className="mb-4 sm:mb-5 shrink-0">
          <div className="font-['Space_Grotesk',sans-serif] font-bold text-[14.5px] sm:text-[16.5px]">
            {originTerminal || displayStart} → {destTerminal || displayDestination}
          </div>
          {viaRoute && (
            <div className="text-[12.5px] sm:text-[13px] text-[#9AA2B6] mt-0.5">via {viaRoute}</div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mb-3 sm:mb-4 shrink-0">
          <div className="bg-[#F6F8FC] border border-[#E5E9F3] rounded-[11px] sm:rounded-[12px] p-2.5 sm:p-3">
            <div className="text-[11px] text-[#9AA2B6] font-medium mb-0.5">ETA</div>
            <div className="font-['Space_Grotesk',sans-serif] font-bold text-[15px] sm:text-[17px]">{etaDisplay}</div>
          </div>
          <div className="bg-[#F6F8FC] border border-[#E5E9F3] rounded-[11px] sm:rounded-[12px] p-2.5 sm:p-3">
            <div className="text-[11px] text-[#9AA2B6] font-medium mb-0.5">Started</div>
            <div className="font-['Space_Grotesk',sans-serif] font-bold text-[15px] sm:text-[17px]">{startTimeStr}</div>
          </div>
        </div>

        <div className="flex-1 min-h-2" />

        {isRunning ? (
          <div className="flex gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={() => { const id = activeTrip?.id || currentTrip?.id; if (id) pauseTrip(id).catch(() => showToast('❌ Failed to pause trip')); }}
              className="flex-1 py-2.5 sm:py-3 rounded-[11px] sm:rounded-[12px] bg-[#FBEEDF] hover:bg-[#F5D9B3] text-[#DB8A2C] font-semibold text-[13px] sm:text-[13.5px] flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Pause
            </button>
            <button
              onClick={() => setShowEndTripModal(true)}
              className="flex-[2] py-2.5 sm:py-3 rounded-[11px] sm:rounded-[12px] bg-gradient-to-r from-rose-500 to-red-600 text-white font-semibold text-[13px] sm:text-[13.5px] flex items-center justify-center gap-2 shadow-[0_10px_20px_-10px_rgba(220,38,38,0.4)] hover:opacity-90 active:scale-[0.99] transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path d="M9 10h6m-6 4h6" />
              </svg>
              End trip
            </button>
          </div>
        ) : isPaused ? (
          <div className="flex gap-2.5 sm:gap-3 shrink-0">
            <button
              onClick={() => { 
                const id = activeTrip?.id || currentTrip?.id; 
                if (id) {
                  resumeTrip(id)
                    .then(() => goToRouteMapWithNavigation())
                    .catch(() => showToast('❌ Failed to resume trip')); 
                }
              }}
              className="flex-[2] py-2.5 sm:py-3 rounded-[11px] sm:rounded-[12px] bg-gradient-to-r from-[#17A673] to-[#149463] text-white font-semibold text-[13px] sm:text-[13.5px] flex items-center justify-center gap-2 shadow-[0_10px_20px_-10px_rgba(20,148,99,0.6)] hover:opacity-90 active:scale-[0.99] transition-all"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                <path d="M8 5v14l11-7z" />
              </svg>
              Resume trip
            </button>
            <button
              onClick={() => setShowEndTripModal(true)}
              className="flex-1 py-2.5 sm:py-3 rounded-[11px] sm:rounded-[12px] bg-[#FBEEDF] hover:bg-[#F5D9B3] text-[#DB8A2C] font-semibold text-[13px] sm:text-[13.5px] flex items-center justify-center gap-2 active:scale-[0.99] transition-all"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
              End
            </button>
          </div>
        ) : null}

        <button
          onClick={goToRouteMapWithNavigation}
          className="w-full mt-2 py-2.5 sm:py-3 rounded-[11px] sm:rounded-[12px] bg-gradient-to-br from-[#12B2E4] to-[#2B4B9E] text-white font-semibold text-[13px] sm:text-[13.5px] flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.99] transition-all shrink-0"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M3 11l18-8-8 18-2-8-8-2z" />
          </svg>
          Open map view
        </button>
      </div>
    );
  };

  const renderTodayTrips = () => {
    // Only use real data from API - no mocked data
    if (!upcomingTrips || upcomingTrips.length === 0) {
      return (
        <div className="bg-white rounded-[16px] sm:rounded-[18px] border border-[#E5E9F3] p-3.5 sm:p-4 lg:p-5 shadow-[0_10px_30px_-18px_rgba(19,35,82,0.25)] flex-1 min-h-0 flex flex-col">
          <div className="flex items-center justify-between mb-2.5 sm:mb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-4 rounded-[3px] bg-[#12B2E4]" />
              <h3 className="font-['Space_Grotesk',sans-serif] font-semibold text-[14px] sm:text-[15.5px]">Today's trips</h3>
            </div>
            <span className="text-[11.5px] sm:text-[12.5px] text-[#9AA2B6] font-medium">0 scheduled</span>
          </div>
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center gap-3 py-6">
            <div className="w-14 h-14 rounded-full bg-[#F1F3F8] flex items-center justify-center text-[#9AA2B6]">
              <svg className="w-6.5 h-6.5" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="3" y="5" width="18" height="16" rx="3" />
                <path d="M16 3v4M8 3v4M3 10h18" />
              </svg>
            </div>
            <div>
              <p className="font-['Space_Grotesk',sans-serif] font-semibold text-[14px] text-[#101832]">No trips scheduled today</p>
              <p className="text-[12.5px] text-[#9AA2B6] mt-1 max-w-[240px] mx-auto">New assignments will show up here as soon as dispatch schedules them.</p>
            </div>
          </div>
        </div>
      );
    }

    const displayList = upcomingTrips.slice(0, 5).map((t: any, idx: number) => {
      const isCompleted = t.status === 'completed';
      const isCurrent = t.status === 'in_progress' || (idx === 0 && isRunning);
      const timeStr = t.scheduledStart ? 
        new Date(t.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : 
        (t.time || '');
      const rName = (typeof t.version?.route === 'object' ? t.version?.route?.routeName : null) || 
        t.route?.routeName || 
        t.route || 
        '';
      const dirStr = t.startStop && t.endStop ? 
        `${t.startStop} → ${t.endStop}` : 
        '';
      const statusLabel = isCompleted ? 'Completed' : (isCurrent ? 'In progress' : 'Scheduled');
      const statusBg = isCompleted ? 'bg-[#E4F6ED] text-[#149463]' : 
        isCurrent ? 'bg-[#EAF0FE] text-[#2B4B9E]' : 
        'bg-[#F1F3F8] text-[#5B6478]';
      return { 
        id: t.id || String(idx), 
        time: timeStr, 
        route: rName, 
        direction: dirStr, 
        status: statusLabel, 
        statusBg, 
        raw: t 
      };
    });

    return (
      <div className="bg-white rounded-[16px] sm:rounded-[18px] border border-[#E5E9F3] p-3.5 sm:p-4 lg:p-5 shadow-[0_10px_30px_-18px_rgba(19,35,82,0.25)] flex-1 min-h-0 flex flex-col">
        <div className="flex items-center justify-between mb-2.5 sm:mb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-1 h-4 rounded-[3px] bg-[#12B2E4]" />
            <h3 className="font-['Space_Grotesk',sans-serif] font-semibold text-[14px] sm:text-[15.5px]">Today's trips</h3>
          </div>
          <span className="text-[11.5px] sm:text-[12.5px] text-[#9AA2B6] font-medium">{displayList.length} scheduled</span>
        </div>

        <div className="flex flex-col gap-1.5 sm:gap-2 min-h-0">
          {displayList.map((t) => {
            const isSelected = selectedTrip && t.id === selectedTrip.id;
            return (
              <div
                key={t.id}
                onClick={() => handleTripSelect(t.raw)}
                className={`flex items-center gap-2.5 sm:gap-3 p-2 sm:p-2.5 rounded-[11px] sm:rounded-[12px] border transition-all cursor-pointer shrink-0 ${
                  isSelected 
                    ? 'border-[#2B4B9E] bg-[#EAF0FE]/30 shadow-sm' 
                    : 'border-[#E5E9F3] hover:border-[#2B4B9E]/30 hover:bg-[#F7F9FD]'
                } ${t.status === 'In progress' ? 'bg-gradient-to-r from-[#E4F6ED] to-white' : ''}`}
              >
                <div className="font-['Space_Grotesk',sans-serif] font-semibold text-[13px] sm:text-[13.5px] text-[#101832] w-10 sm:w-11 flex-shrink-0">{t.time}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[13px] sm:text-[13.5px] truncate">{t.route}</div>
                  {t.direction && (
                    <div className="text-[11px] sm:text-[11.5px] text-[#9AA2B6] truncate">{t.direction}</div>
                  )}
                </div>
                <span className={`text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full whitespace-nowrap ${t.statusBg}`}>
                  {t.status}
                </span>
                {isSelected && (
                  <span className="text-[10px] font-bold text-[#2B4B9E] bg-[#2B4B9E]/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                    Selected
                  </span>
                )}
                <svg className="hidden sm:block w-4 h-4 text-[#9AA2B6] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Quick Actions — with SINGLE thin border ──────────────────
  const renderQuickActions = () => (
    <div className="bg-white rounded-[16px] sm:rounded-[18px] border border-[#E5E9F3] p-3.5 sm:p-4 lg:p-5 shadow-[0_10px_30px_-18px_rgba(19,35,82,0.25)] shrink-0">
      <div className="flex items-center gap-2.5 mb-3 sm:mb-3.5">
        <div className="w-1 h-4 rounded-[3px] bg-[#12B2E4]" />
        <h3 className="font-['Space_Grotesk',sans-serif] font-semibold text-[14px] sm:text-[15.5px]">Quick actions</h3>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-2.5">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.id}
            onClick={() => {
              switch (action.id) {
                case 'incident':
                  setShowIncidentModal(true);
                  break;
                case 'dispatch':
                  setShowDispatchModal(true);
                  break;
                case 'maintenance':
                  setShowMaintenanceModal(true);
                  break;
                case 'shift-handover': {
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
                case 'check-handovers':
                  setShowHandoverListModal(true);
                  break;
                default:
                  break;
              }
            }}
            className="group relative flex flex-col items-center justify-center gap-1.5 h-[74px] sm:h-[82px] rounded-[14px] border border-[#E5E9F3] bg-white hover:border-[#12B2E4]/40 hover:shadow-[0_8px_18px_-12px_rgba(19,35,82,0.35)] active:scale-[0.96] transition-all"
          >
            {action.id === 'check-handovers' && pendingHandovers.length > 0 && (
              <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                {pendingHandovers.length}
              </span>
            )}
            <div
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-transform group-active:scale-90"
              style={{ background: action.bg, color: action.tint }}
            >
              <span className="w-[16px] h-[16px] sm:w-[17px] sm:h-[17px]">{action.icon}</span>
            </div>
            <span className="text-[9.5px] sm:text-[10.5px] font-semibold text-center leading-tight text-[#5B6478] px-0.5">{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // ─── Main Render ─────────────────────────────────────────────
  return (
    <div className="h-[100dvh] w-full bg-[#EDF0F8] font-['Inter',sans-serif] p-3 sm:p-5 lg:p-7 flex justify-center overflow-hidden">
      <div className="w-full max-w-[1180px] h-full flex flex-col gap-3 sm:gap-4 lg:gap-5 min-h-0">
        {renderHeader()}

        {/* Pending Handover Banner */}
        {handovers.filter(h => String(h.status).toLowerCase() === 'pending').length > 0 && (
          <div className="shrink-0 animate-in fade-in slide-in-from-top-2 duration-300">
            <button
              onClick={() => setShowHandoverListModal(true)}
              className="w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl shadow-lg shadow-indigo-500/30 text-left hover:from-indigo-400 hover:to-purple-500 transition-all group active:scale-[0.99]"
            >
              <span className="relative flex-shrink-0">
                <span className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1.55fr_1fr] gap-3 sm:gap-4 lg:gap-5 items-stretch overflow-y-auto lg:overflow-hidden">
          <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5 min-h-0 lg:overflow-hidden">
            {loading ? <TodayTripsSkeleton /> : renderTodayTrips()}
            {renderQuickActions()}
          </div>

          <div className="min-h-[420px] lg:min-h-0 lg:overflow-hidden">
            {loading ? <CurrentTripSkeleton /> : renderCurrentTrip()}
          </div>
        </div>

        {/* Modals */}
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

        {/* Incident Modal */}
        <ModalShell
          isOpen={showIncidentModal}
          busy={submittingIncident}
          onClose={() => {
            if (submittingIncident) return;
            setShowIncidentModal(false);
            setIncidentType('');
            setIncidentDescription('');
            setIncidentError('');
          }}
          title="Report Incident"
          subtitle="Give dispatch accurate, timely details"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.3 3.6L2.7 17a1.8 1.8 0 0 0 1.5 2.7h15.6a1.8 1.8 0 0 0 1.5-2.7L13.7 3.6a1.8 1.8 0 0 0-3.4 0z" />
              <path d="M12 9v4" /><path d="M12 16.5h.01" />
            </svg>
          }
          footer={
            <div className="flex gap-2.5">
              <SecondaryButton
                onClick={() => {
                  setShowIncidentModal(false);
                  setIncidentType('');
                  setIncidentDescription('');
                  setIncidentSeverity('medium');
                  setIncidentError('');
                }}
                disabled={submittingIncident}
                className="flex-1"
              >
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={submitIncident} disabled={!hasActiveTrip || submittingIncident} loading={submittingIncident} className="flex-[1.4]">
                {submittingIncident ? 'Submitting…' : 'Submit report'}
              </PrimaryButton>
            </div>
          }
        >
          {!hasActiveTrip && (
            <InlineNotice tone="warning" title="Action required" message="Please start a trip before reporting an incident." />
          )}

          <div>
            <label className={labelClass}>Incident type <span className="text-red-500">*</span></label>
            <select
              value={incidentType}
              onChange={(e) => { setIncidentType(e.target.value); setIncidentError(''); }}
              disabled={!hasActiveTrip || submittingIncident}
              className={fieldClass}
            >
              <option value="">Select incident type</option>
              {INCIDENT_REASONS.map((reason) => (
                <option key={reason} value={reason}>{reason}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Severity <span className="text-red-500">*</span></label>
            <select
              value={incidentSeverity}
              onChange={(e) => setIncidentSeverity(e.target.value as 'low' | 'medium' | 'high' | 'critical')}
              disabled={!hasActiveTrip || submittingIncident}
              className={fieldClass}
            >
              <option value="low">🟢 Low — minor, no immediate action</option>
              <option value="medium">🟡 Medium — needs attention soon</option>
              <option value="high">🟠 High — urgent</option>
              <option value="critical">🔴 Critical — safety emergency</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Description <span className="text-red-500">*</span></label>
            <textarea
              value={incidentDescription}
              onChange={(e) => { setIncidentDescription(e.target.value); setIncidentError(''); }}
              placeholder="Describe what happened…"
              rows={4}
              disabled={!hasActiveTrip || submittingIncident}
              className={`${fieldClass} resize-none`}
            />
          </div>

          {incidentError && <InlineNotice tone="error" title="Error" message={incidentError} />}
        </ModalShell>

        {/* Maintenance Modal */}
        <ModalShell
          isOpen={showMaintenanceModal}
          busy={submittingMaintenance}
          onClose={() => {
            if (submittingMaintenance) return;
            setShowMaintenanceModal(false);
            setMaintenanceType('');
            setMaintenanceDescription('');
            setMaintenanceError('');
          }}
          title="Request Maintenance"
          subtitle="Submit a defect report for your vehicle"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          footer={
            <div className="flex gap-2.5">
              <SecondaryButton
                onClick={() => {
                  setShowMaintenanceModal(false);
                  setMaintenanceType('');
                  setMaintenanceDescription('');
                  setMaintenanceError('');
                }}
                disabled={submittingMaintenance}
                className="flex-1"
              >
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={submitMaintenance} disabled={!hasActiveTrip || submittingMaintenance} loading={submittingMaintenance} className="flex-[1.4]">
                {submittingMaintenance ? 'Submitting…' : 'Submit request'}
              </PrimaryButton>
            </div>
          }
        >
          {!hasActiveTrip && (
            <InlineNotice tone="warning" title="Action required" message="Please start a trip before requesting maintenance." />
          )}

          <div>
            <label className={labelClass}>Maintenance type <span className="text-red-500">*</span></label>
            <select
              value={maintenanceType}
              onChange={(e) => { setMaintenanceType(e.target.value); setMaintenanceError(''); }}
              disabled={!hasActiveTrip || submittingMaintenance}
              className={fieldClass}
            >
              <option value="">Select maintenance type</option>
              {MAINTENANCE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Priority level</label>
            <select
              value={maintenancePriority}
              onChange={(e) => setMaintenancePriority(e.target.value)}
              disabled={!hasActiveTrip || submittingMaintenance}
              className={fieldClass}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Description <span className="text-red-500">*</span></label>
            <textarea
              value={maintenanceDescription}
              onChange={(e) => { setMaintenanceDescription(e.target.value); setMaintenanceError(''); }}
              placeholder="Describe the maintenance issue…"
              rows={3}
              disabled={!hasActiveTrip || submittingMaintenance}
              className={`${fieldClass} resize-none`}
            />
          </div>

          {maintenanceError && <InlineNotice tone="error" title="Error" message={maintenanceError} />}
        </ModalShell>

        {/* Dispatch Modal */}
        <ModalShell
          isOpen={showDispatchModal}
          onClose={() => setShowDispatchModal(false)}
          title="Contact Dispatch"
          subtitle="Reach the control room right away"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          }
        >
          <button
            onClick={() => {
              setShowDispatchModal(false);
              window.location.href = `tel:${DISPATCH_PHONE}`;
            }}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#EEF3FE] border border-[#D5E1FB] hover:bg-[#E1EAFC] active:scale-[0.99] transition-all group"
          >
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#2B6BE0] shrink-0 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div className="text-left flex-1 min-w-0">
              <h4 className="font-bold text-[13.5px] text-[#101832]">Call control room</h4>
              <p className="text-[12px] text-[#9AA2B6]">Direct voice call to {DISPATCH_PHONE}</p>
            </div>
            <svg className="w-4.5 h-4.5 text-[#9AA2B6] group-hover:text-[#2B6BE0] transition-colors shrink-0" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => {
              setShowDispatchModal(false);
              setShowIncidentModal(true);
            }}
            className="w-full flex items-center gap-3.5 p-3.5 rounded-2xl bg-rose-50 border border-rose-100 hover:bg-rose-100 active:scale-[0.99] transition-all group"
          >
            <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-rose-500 shrink-0 shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="text-left flex-1 min-w-0">
              <h4 className="font-bold text-[13.5px] text-[#101832]">Report emergency</h4>
              <p className="text-[12px] text-[#9AA2B6]">Send an immediate SOS to dispatch</p>
            </div>
            <svg className="w-4.5 h-4.5 text-[#9AA2B6] group-hover:text-rose-500 transition-colors shrink-0" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </ModalShell>

        {/* Shift Handover Modal */}
        <ModalShell
          isOpen={showShiftHandoverModal}
          busy={submittingHandover}
          onClose={() => {
            if (submittingHandover) return;
            setShowShiftHandoverModal(false);
            setHandoverNotes('');
            setHandoverVehicleCondition('good');
            setHandoverError('');
            setNextDriverInfo(null);
          }}
          title="Shift Handover"
          subtitle="Transfer vehicle keys to the next driver"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          }
          footer={
            <div className="flex gap-2.5">
              <SecondaryButton
                onClick={() => {
                  setShowShiftHandoverModal(false);
                  setHandoverNotes('');
                  setHandoverVehicleCondition('good');
                  setHandoverError('');
                  setNextDriverInfo(null);
                }}
                disabled={submittingHandover}
                className="flex-1"
              >
                Cancel
              </SecondaryButton>
              <PrimaryButton onClick={submitShiftHandover} disabled={!hasActiveTrip || submittingHandover} loading={submittingHandover} className="flex-[1.4]">
                {submittingHandover ? 'Submitting…' : 'Complete handover'}
              </PrimaryButton>
            </div>
          }
        >
          {!hasActiveTrip && (
            <InlineNotice tone="warning" title="Action required" message="Please start a trip before creating a handover." />
          )}

          <div>
            <label className={labelClass}>Current driver</label>
            <input type="text" value={driverName} disabled className={`${fieldClass} bg-[#F6F8FC]`} />
          </div>

          <div>
            <label className={labelClass}>Next driver</label>
            {loadingNextDriver ? (
              <div className={`${fieldClass} bg-[#F6F8FC] flex items-center gap-2 text-[#9AA2B6]`}>
                <span className="w-3.5 h-3.5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                Looking up next driver…
              </div>
            ) : nextDriverInfo ? (
              <div className="w-full border border-emerald-200 rounded-xl px-3.5 py-2.5 sm:py-3 text-[13.5px] text-emerald-700 bg-emerald-50 flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-semibold truncate">{nextDriverInfo.driverName}</span>
                <span className="text-[11px] text-emerald-500 ml-auto shrink-0">Auto-assigned</span>
              </div>
            ) : (
              <InlineNotice tone="warning" title="No next driver assigned" message="Contact admin to assign the next shift." />
            )}
          </div>

          <div>
            <label className={labelClass}>Vehicle condition</label>
            <select
              value={handoverVehicleCondition}
              onChange={(e) => setHandoverVehicleCondition(e.target.value)}
              disabled={!hasActiveTrip || submittingHandover}
              className={fieldClass}
            >
              {VEHICLE_CONDITIONS.map((condition) => (
                <option key={condition} value={condition}>{condition.charAt(0).toUpperCase() + condition.slice(1)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Handover notes</label>
            <textarea
              value={handoverNotes}
              onChange={(e) => { setHandoverNotes(e.target.value); setHandoverError(''); }}
              placeholder="Any important information for the next driver…"
              rows={3}
              disabled={!hasActiveTrip || submittingHandover}
              className={`${fieldClass} resize-none`}
            />
          </div>

          {handoverError && <InlineNotice tone="error" title="Error" message={handoverError} />}
        </ModalShell>

        {/* Trip Details Modal */}
        {selectedTripModal && (() => {
          const m = selectedTripModal as any;
          const mRouteObj = m.version?.route || m.route;
          const mRouteName = (typeof mRouteObj === 'object' ? mRouteObj?.routeName : mRouteObj) || '';
          const mVia = m.version?.route?.via || m.via || null;
          const mOrigin = m.version?.origin || (typeof mRouteObj === 'object' ? mRouteObj?.origin || mRouteObj?.startLocation : null) || m.startStop || '';
          const mDest = m.version?.destination || (typeof mRouteObj === 'object' ? mRouteObj?.destination || mRouteObj?.endLocation : null) || m.endStop || '';
          const mDistance = m.distance || m.version?.distance || null;
          const mDuration = m.duration || m.estimatedDuration || '';
          const mCondition = m.vehicleCondition || m.bus?.condition || m.condition || null;

          const rawStops: any[] = m.version?.routeStops || m.routeStops || m.stops || [];
          const stopList = Array.isArray(rawStops) && rawStops.length > 0 && typeof rawStops[0] === 'object'
            ? rawStops.map((s: any, idx: number) => ({
                name: s.name || s.stopName || s.stop?.name || s.location?.name || `Stop ${idx + 1}`,
                time: s.arrivalTime || s.eta || s.scheduledTime || null,
              }))
            : null;
          const stopCountFallback = typeof rawStops === 'number' ? rawStops : (Array.isArray(rawStops) ? rawStops.length : 0);

          return (
            <ModalShell
              isOpen={!!selectedTripModal}
              onClose={() => setSelectedTripModal(null)}
              title={mRouteName || 'Trip Details'}
              subtitle={`${mOrigin || ''} → ${mDest || ''}${mVia ? ` · via ${mVia}` : ''}`}
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 20l-5-2V6l5 2m0 12l6-2m-6 2V8m6 10l5 2V8l-5-2m0 14V6m0 2l-6-2" />
                </svg>
              }
              footer={
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <SecondaryButton
                    onClick={() => { setSelectedTripModal(null); goToRouteMapWithNavigation(); }}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    🗺️ View route map
                  </SecondaryButton>
                  <PrimaryButton
                    onClick={async () => {
                      try {
                        const id = m.id || m.tripId;
                        if (id) {
                          await startTrip(id);
                          setSelectedTripModal(null);
                          showToast('🚌 Trip started successfully!');
                          loadActiveTrip();
                          setSelectedTrip(null);
                        } else {
                          showToast('❌ Invalid trip ID');
                        }
                      } catch (err: any) {
                        showToast(`❌ Failed to start: ${err.message || 'Error'}`);
                      }
                    }}
                    className="flex-[1.2]"
                  >
                    ▶ Start trip
                  </PrimaryButton>
                </div>
              }
            >
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div className="bg-[#EEF3FE] p-3 rounded-xl border border-[#D5E1FB]">
                  <p className="text-[10px] font-bold text-[#9AA2B6] uppercase tracking-wide">Departure</p>
                  <p className="text-[15px] font-bold text-[#2B4B9E] mt-0.5">
                    {m.scheduledStart ? new Date(m.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : '--:--'}
                  </p>
                </div>
                <div className="bg-[#F5F1FD] p-3 rounded-xl border border-[#E3D8FA]">
                  <p className="text-[10px] font-bold text-[#9AA2B6] uppercase tracking-wide">Assigned bus</p>
                  <p className="text-[15px] font-bold text-purple-700 font-mono mt-0.5 truncate">
                    {m.bus?.plateNumber || m.bus || '--'}
                  </p>
                </div>
                <div className="bg-[#E9F8EF] p-3 rounded-xl border border-[#CDEEDA]">
                  <p className="text-[10px] font-bold text-[#9AA2B6] uppercase tracking-wide">Status</p>
                  <p className="text-[15px] font-bold text-emerald-600 mt-0.5 capitalize truncate">{m.status || 'Scheduled'}</p>
                </div>
                <div className="bg-[#FEF6EC] p-3 rounded-xl border border-[#F7E4C6]">
                  <p className="text-[10px] font-bold text-[#9AA2B6] uppercase tracking-wide">Distance</p>
                  <p className="text-[15px] font-bold text-amber-700 mt-0.5">{mDistance || displayDistance || '--'}</p>
                </div>
                <div className="bg-[#EAF6FC] p-3 rounded-xl border border-[#CFEAF6]">
                  <p className="text-[10px] font-bold text-[#9AA2B6] uppercase tracking-wide">Est. duration</p>
                  <p className="text-[15px] font-bold text-sky-700 mt-0.5">{mDuration || '--'}</p>
                </div>
                <div className="bg-[#F6F8FC] p-3 rounded-xl border border-[#E5E9F3]">
                  <p className="text-[10px] font-bold text-[#9AA2B6] uppercase tracking-wide">Vehicle condition</p>
                  <p className="text-[15px] font-bold text-[#5B6478] mt-0.5 capitalize">{mCondition || 'Good'}</p>
                </div>
              </div>

              <div>
                <h3 className="text-[12px] font-bold tracking-wide text-[#9AA2B6] uppercase mb-2.5">
                  All stops {stopList ? `(${stopList.length})` : stopCountFallback ? `(${stopCountFallback})` : ''}
                </h3>

                {stopList && stopList.length > 0 ? (
                  <div className="relative pl-5">
                    <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-gray-200" />
                    <div className="flex flex-col gap-3.5">
                      {stopList.map((s, idx) => (
                        <div key={idx} className="relative flex items-center gap-3">
                          <span className={`absolute -left-5 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
                            idx === 0 ? 'bg-[#0B1739] ring-[#0B1739]/20' : idx === stopList.length - 1 ? 'bg-[#12B2E4] ring-[#12B2E4]/20' : 'bg-gray-300 ring-gray-200'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[13.5px] font-semibold text-[#1B2340] truncate">{s.name}</p>
                          </div>
                          {s.time && <span className="text-[12px] font-bold text-[#9AA2B6] shrink-0">{s.time}</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl border border-dashed border-[#E5E9F3] bg-[#F6F8FC] text-center">
                    <p className="text-[13.5px] font-semibold text-[#5B6478]">{mOrigin || ''} → {mDest || ''}</p>
                    <p className="text-[12px] text-[#9AA2B6] mt-1">
                      {stopCountFallback ? `${stopCountFallback} stops along this route` : "Detailed stop-by-stop data isn't available for this trip yet"}
                    </p>
                  </div>
                )}
              </div>
            </ModalShell>
          );
        })()}

        <Toast message={toastMsg} />
      </div>
    </div>
  );
};

export default MyTripPage;