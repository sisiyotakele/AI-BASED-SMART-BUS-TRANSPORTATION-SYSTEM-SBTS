// src/features/driver/pages/RouteMapPage.tsx

import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSpinner, FaPlay, FaPause, FaStop, FaUndo, FaArrowLeft, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { tripsApi } from '../services/api/trips';
import { MapType, TRAFFIC_STYLES, STOPS, STOP_NAMES } from '../constants/map';
import { useDriverProfile, useGeolocation, useTripState, useToast } from '../hooks';
import { useDriverData } from '../hooks/useDriverData';
import { DEFAULT_DRIVER, DISPATCH_PHONE, INCIDENT_REASONS, MAINTENANCE_TYPES, VEHICLE_CONDITIONS } from '../constants';
import { EndTripModal, HandoverListModal } from '../components/modals';
import { ShiftHandover } from '../types';
import { getGreeting, getInitials } from '../utils';
import { incidentsApi } from '../services/api/incidents';
import { handoversApi } from '../services/api/handovers';

const RouteMapView = lazy(() => import('../components/map/RouteMapView'));

interface TripState {
  position: [number, number];
  currentStop: number;
  nextStop: string;
  etaFormatted: string;
  remainingKm: number;
  routeCoordinates?: [number, number][];
  routeStopNames?: string[];
}

type TrafficStatus = 'low' | 'moderate' | 'heavy';

const SIDEBAR_WIDTH = 320;

const QUICK_ACTIONS = [
  { id: 'incident', label: 'Report Incident', tint: '#DB8A2C', bg: '#FEF6EC', icon: '⚠️' },
  { id: 'dispatch', label: 'Contact Dispatch', tint: '#2B6BE0', bg: '#EEF3FE', icon: '📞' },
  { id: 'maintenance', label: 'Vehicle Problem', tint: '#C2410C', bg: '#FEF3EC', icon: '🔧' },
  { id: 'shift-handover', label: 'Key Handover', tint: '#7C3AED', bg: '#F5F1FD', icon: '🔑' },
  { id: 'check-handovers', label: 'Key Status', tint: '#0B1739', bg: '#EEF0F7', icon: '🔒' },
];

const RouteMapPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile: localProfile } = useDriverProfile();
  const { getCurrentPosition } = useGeolocation();
  const { startTrip, pauseTrip, resumeTrip, endTrip, isIdle, isRunning, isPaused, setTripStatus } = useTripState();
  const { showToast } = useToast();
  const { profile: apiProfile, currentTrip, upcomingTrips, loading } = useDriverData();

  // ─── State ──────────────────────────────────────────────────────
  const [sidebarOpen, setSidebarOpen] = useState(false); // hidden by default, user toggles it open
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showShiftHandoverModal, setShowShiftHandoverModal] = useState(false);
  const [showHandoverListModal, setShowHandoverListModal] = useState(false);
  const [showEndTripModal, setShowEndTripModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  const [handovers, setHandovers] = useState<ShiftHandover[]>([]);
  const [handoversLoading, setHandoversLoading] = useState(false);

  const [incidentType, setIncidentType] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentSeverity, setIncidentSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [submittingIncident, setSubmittingIncident] = useState(false);
  const [incidentError, setIncidentError] = useState('');

  const [maintenanceType, setMaintenanceType] = useState('');
  const [maintenanceDescription, setMaintenanceDescription] = useState('');
  const [maintenancePriority, setMaintenancePriority] = useState('medium');
  const [submittingMaintenance, setSubmittingMaintenance] = useState(false);
  const [maintenanceError, setMaintenanceError] = useState('');

  const [handoverNotes, setHandoverNotes] = useState('');
  const [handoverVehicleCondition, setHandoverVehicleCondition] = useState('good');
  const [submittingHandover, setSubmittingHandover] = useState(false);
  const [handoverError, setHandoverError] = useState('');
  const [nextDriverInfo, setNextDriverInfo] = useState<{ shiftId: string; driverName: string; driverId: string } | null>(null);
  const [loadingNextDriver, setLoadingNextDriver] = useState(false);

  const [trip, setTrip] = useState<TripState>({
    position: [9.03, 38.74], currentStop: 0, nextStop: 'Loading...', etaFormatted: '-- min', remainingKm: 0,
  });
  const [speed, setSpeed] = useState(0);
  const [trafficStatus, setTrafficStatus] = useState<TrafficStatus>('moderate');
  const [isFollowing, setIsFollowing] = useState(true);
  const [mapType, setMapType] = useState<MapType>("terrain"); // Default to terrain (3D-style) view
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routePath, setRoutePath] = useState<[number, number][]>([]);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [busId, setBusId] = useState<string | null>(null);
  const [hasRoute, setHasRoute] = useState(false);

  const gpsWatchId = useRef<number | null>(null);

  // ─── Derived ──────────────────────────────────────────────────
  const driverName = apiProfile?.user?.fullName || apiProfile?.fullName || localProfile?.name || DEFAULT_DRIVER.name;
  const driverInitials = getInitials(driverName);
  const greeting = getGreeting();
  const hasActiveTrip = !!(activeTrip || currentTrip);
  const currentTripData = (activeTrip || currentTrip || upcomingTrips?.[0]) as any;
  const busPlate = currentTripData?.bus?.plateNumber || currentTripData?.bus || 'AA-4000S';
  const shiftHours = currentTripData?.shift ? `${currentTripData.shift.shiftStart || '06:00'} – ${currentTripData.shift.shiftEnd || '14:00'}` : '06:00 – 14:00';
  const hasPendingHandover = handovers.some(h => String(h.status).toLowerCase() === 'pending');

  // Real trip progress — derived only from backend trip data, no simulated/mocked increments.
  const progress = (() => {
    if (!currentTrip) return 0;
    if ((currentTrip as any).progress) return (currentTrip as any).progress;
    if ((currentTrip as any).completionPercentage) return (currentTrip as any).completionPercentage;
    const totalStops = currentTrip.stops || 1;
    const completedStops = (currentTrip as any).completedStops || 0;
    return Math.min(Math.round((completedStops / totalStops) * 100), 100);
  })();

  const calculateETA = (tripData: any): string => {
    if (!tripData) return '150 min';
    const explicitEta = tripData.etaMinutes ?? tripData.eta;
    if (typeof explicitEta === 'number') return `${explicitEta} min`;
    if (typeof explicitEta === 'string' && explicitEta.trim()) return explicitEta;
    const totalDuration = tripData.estimatedDuration || tripData.duration || tripData.version?.estimatedDuration;
    if (typeof totalDuration === 'number' && totalDuration > 0) {
      const remaining = Math.max(Math.round(totalDuration * (1 - progress / 100)), 0);
      return `${remaining} min`;
    }
    if (tripData.scheduledEnd) {
      const end = new Date(tripData.scheduledEnd).getTime();
      if (!Number.isNaN(end)) {
        const diffMin = Math.max(Math.round((end - Date.now()) / 60000), 0);
        return `${diffMin} min`;
      }
    }
    return '150 min';
  };

  const tripToDisplay = activeTrip || currentTrip;
  const routeObj = (tripToDisplay as any)?.version?.route || (tripToDisplay as any)?.route;
  const originTerminal = (tripToDisplay as any)?.version?.origin || (typeof routeObj === 'object' ? (routeObj as any)?.origin || (routeObj as any)?.startLocation : null) || tripToDisplay?.startStop || 'Megenagna Terminal';
  const destTerminal = (tripToDisplay as any)?.version?.destination || (typeof routeObj === 'object' ? (routeObj as any)?.destination || (routeObj as any)?.endLocation : null) || tripToDisplay?.endStop || 'Meskel Square Terminal';
  const viaRoute = (tripToDisplay as any)?.version?.route?.via || (tripToDisplay as any)?.via || 'Mercato → Bole';
  const etaDisplay = calculateETA(tripToDisplay);
  const departureTime = tripToDisplay?.scheduledStart ? new Date(tripToDisplay.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : (tripToDisplay?.time || '06:00');

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
        status: h.status === 'confirmed' ? 'Completed' : h.status === 'cancelled' ? 'Rejected' : 'Pending',
        initiatedBy: h.fromShift?.driver?.fullName || '',
        initiatedTime: h.handoverTime || new Date().toISOString(),
        currentDriverLocation: h.currentDriverLocation || '',
      })));
    } catch (err) { console.error('Failed to load handovers:', err); } finally { setHandoversLoading(false); }
  }, []);

  useEffect(() => { loadHandovers(); }, [loadHandovers]);

  // ─── Load Active Trip ──────────────────────────────────────────
  const loadActiveTrip = useCallback(async () => {
    try {
      const tripData = await tripsApi.getCurrentTrip();
      if (tripData) {
        setActiveTrip(tripData);
        setBusId(tripData.bus_id || null);
        setHasRoute(true);
        if (tripData.status === 'in_progress' && isIdle) setTripStatus('running');
        else if (tripData.status === 'paused' && isIdle) setTripStatus('paused');
        const currentStopIndex = 0;
        setTrip({
          position: [9.03, 38.74], currentStop: currentStopIndex,
          nextStop: tripData.routeStopNames?.[currentStopIndex + 1] || 'Next Stop',
          etaFormatted: tripData.duration || '25 min',
          remainingKm: parseFloat(tripData.distance?.replace(' km', '') || '12.5'),
          routeCoordinates: tripData.routeCoordinates,
          routeStopNames: tripData.routeStopNames,
        });
        if (tripData.routeCoordinates && tripData.routeCoordinates.length > 0) {
          setRoutePath(tripData.routeCoordinates as [number, number][]);
        } else if (STOPS && STOPS.length > 0) {
          setRoutePath(STOPS as [number, number][]);
        }
      } else {
        setActiveTrip(null);
        setBusId(null);
        setHasRoute(false);
      }
    } catch (err) {
      console.warn('Could not load active trip:', err);
      setActiveTrip(null);
      setBusId(null);
      setHasRoute(false);
    }
  }, [isIdle]);

  useEffect(() => {
    loadActiveTrip();
    const timer = setTimeout(() => setMapLoaded(true), 300);
    return () => clearTimeout(timer);
  }, [loadActiveTrip]);

  // ─── GPS ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) return;
    gpsWatchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPosition: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        const newSpeed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : speed;
        let traffic: TrafficStatus = 'moderate';
        if (newSpeed > 40) traffic = 'low';
        else if (newSpeed > 20) traffic = 'moderate';
        else traffic = 'heavy';
        setTrip(prev => ({ ...prev, position: newPosition }));
        setSpeed(newSpeed);
        setTrafficStatus(traffic);
        if (trip.remainingKm > 0 && newSpeed > 0) {
          const etaMinutes = Math.round((trip.remainingKm / newSpeed) * 60);
          const etaFormatted = etaMinutes > 60 ? `${Math.floor(etaMinutes / 60)}h ${etaMinutes % 60}m` : `${etaMinutes} min`;
          setTrip(prev => ({ ...prev, etaFormatted }));
        }
      },
      (err) => console.warn('GPS watch error:', err),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10000 }
    );
    return () => { if (gpsWatchId.current) navigator.geolocation.clearWatch(gpsWatchId.current); };
  }, [trip.remainingKm, speed]);

  // ─── Handlers ──────────────────────────────────────────────────
  const goBack = () => navigate('/driver');
  const toggleSidebar = () => setSidebarOpen(prev => !prev);

  const handleStartTrip = async () => {
    const id = activeTrip?.id || currentTrip?.id || (upcomingTrips && upcomingTrips[0]?.id);
    if (id) {
      try {
        await startTrip(id);
        showToast('🚌 Trip started!');
        loadActiveTrip();
      } catch (err: any) { showToast(`❌ ${err.message}`); }
    } else {
      showToast('❌ No assigned trip found.');
    }
  };

  const handlePauseTrip = async () => {
    const id = activeTrip?.id || currentTrip?.id;
    if (id) { try { await pauseTrip(id); showToast('⏸️ Paused'); } catch (err: any) { showToast(`❌ ${err.message}`); } }
  };

  const handleResumeTrip = async () => {
    const id = activeTrip?.id || currentTrip?.id;
    if (id) { try { await resumeTrip(id); showToast('▶️ Resumed'); } catch (err: any) { showToast(`❌ ${err.message}`); } }
  };

  const handleEndTrip = () => setShowEndTripModal(true);

  const handleConfirmEndTrip = async () => {
    try {
      const tripId = activeTrip?.id || currentTrip?.id;
      if (tripId) { await endTrip(tripId, showToast); }
      setShowEndTripModal(false);
      navigate('/driver');
    } catch (err: any) { showToast(`❌ ${err.message}`); }
  };

  // ─── Submit Incident ──────────────────────────────────────────
  const submitIncident = useCallback(async () => {
    if (!incidentType) { setIncidentError('Please select an incident type'); return; }
    if (!incidentDescription) { setIncidentError('Please enter a description'); return; }
    if (!hasActiveTrip) { setIncidentError('Please start a trip first.'); return; }
    setIncidentError('');
    setSubmittingIncident(true);
    try {
      let lat = 9.03, lng = 38.74;
      try { const pos = await getCurrentPosition(); if (pos) { lat = pos.latitude; lng = pos.longitude; } } catch (e) {}
      const tripToUse = activeTrip || currentTrip;
      if (!tripToUse || !tripToUse.id) { setIncidentError('No active trip found.'); setSubmittingIncident(false); return; }
      await incidentsApi.create({ tripId: tripToUse.id, incidentType, description: incidentDescription, severity: incidentSeverity, latitude: lat, longitude: lng });
      setShowIncidentModal(false);
      setIncidentType(''); setIncidentDescription(''); setIncidentSeverity('medium'); setIncidentError('');
      showToast('✅ Incident reported');
    } catch (err: any) { setIncidentError(err.message || 'Failed'); } finally { setSubmittingIncident(false); }
  }, [incidentType, incidentDescription, incidentSeverity, hasActiveTrip, activeTrip, currentTrip, getCurrentPosition, showToast]);

  // ─── Submit Maintenance ──────────────────────────────────────
  const submitMaintenance = useCallback(async () => {
    if (!maintenanceType) { setMaintenanceError('Please select a maintenance type'); return; }
    if (!maintenanceDescription) { setMaintenanceError('Please enter a description'); return; }
    if (!hasActiveTrip) { setMaintenanceError('Please start a trip first.'); return; }
    setMaintenanceError(''); setSubmittingMaintenance(true);
    try {
      let lat = 9.03, lng = 38.74;
      try { const pos = await getCurrentPosition(); if (pos) { lat = pos.latitude; lng = pos.longitude; } } catch (e) {}
      let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      if (maintenancePriority === 'urgent') severity = 'critical';
      else if (maintenancePriority === 'high') severity = 'high';
      else if (maintenancePriority === 'low') severity = 'low';
      const tripToUse = activeTrip || currentTrip;
      if (!tripToUse || !tripToUse.id) { setMaintenanceError('No active trip found.'); setSubmittingMaintenance(false); return; }
      await incidentsApi.create({ tripId: tripToUse.id, incidentType: `Maintenance: ${maintenanceType}`, description: maintenanceDescription, severity, latitude: lat, longitude: lng });
      setShowMaintenanceModal(false);
      setMaintenanceType(''); setMaintenanceDescription(''); setMaintenancePriority('medium'); setMaintenanceError('');
      showToast('✅ Maintenance requested');
    } catch (err: any) { setMaintenanceError(err.message || 'Failed'); } finally { setSubmittingMaintenance(false); }
  }, [maintenanceType, maintenanceDescription, maintenancePriority, hasActiveTrip, activeTrip, getCurrentPosition, showToast]);

  // ─── Submit Handover ──────────────────────────────────────────
  const submitShiftHandover = useCallback(async () => {
    if (!nextDriverInfo) { setHandoverError('No next driver found.'); return; }
    if (!hasActiveTrip) { setHandoverError('Please start a trip first.'); return; }
    setHandoverError(''); setSubmittingHandover(true);
    try {
      await handoversApi.create({ busId: activeTrip?.bus_id || busId || '', fromShiftId: activeTrip?.shiftId, toShiftId: nextDriverInfo.shiftId, handoverTime: new Date().toISOString(), notes: `Vehicle condition: ${handoverVehicleCondition}. ${handoverNotes}`.trim() });
      setShowShiftHandoverModal(false);
      setHandoverNotes(''); setHandoverVehicleCondition('good'); setHandoverError(''); setNextDriverInfo(null);
      showToast(`📋 Handover sent to ${nextDriverInfo.driverName}`);
      loadHandovers();
    } catch (err: any) { setHandoverError(err.message || 'Failed'); } finally { setSubmittingHandover(false); }
  }, [nextDriverInfo, handoverNotes, handoverVehicleCondition, hasActiveTrip, activeTrip, busId, showToast, loadHandovers]);

  // ─── Accept/Reject Handover ──────────────────────────────────
  const acceptHandover = useCallback(async (id: string | number) => {
    try { await handoversApi.accept(String(id)); setHandovers(prev => prev.map(h => String(h.id) === String(id) ? { ...h, status: 'Completed' } : h)); setShowHandoverListModal(false); showToast('✅ Keys received!'); loadHandovers(); } catch (err: any) { showToast(`❌ ${err.message}`); }
  }, [showToast, loadHandovers]);

  const rejectHandover = useCallback(async (id: string | number) => {
    try { await handoversApi.reject(String(id)); setHandovers(prev => prev.map(h => String(h.id) === String(id) ? { ...h, status: 'Rejected' } : h)); setShowHandoverListModal(false); showToast('❌ Handover rejected.'); loadHandovers(); } catch (err: any) { showToast(`❌ ${err.message}`); }
  }, [showToast, loadHandovers]);

  // ─── Traffic Style ────────────────────────────────────────────
  const getTrafficStyle = () => {
    const statusMap = { low: 'Normal', moderate: 'Moderate', heavy: 'Heavy' };
    const mappedKey = statusMap[trafficStatus] || 'Moderate';
    const styles = TRAFFIC_STYLES || { Normal: { text: 'text-emerald-600', chip: 'bg-emerald-50 text-emerald-600', dot: 'bg-emerald-500' }, Moderate: { text: 'text-amber-600', chip: 'bg-amber-50 text-amber-600', dot: 'bg-amber-500' }, Heavy: { text: 'text-red-600', chip: 'bg-red-50 text-red-600', dot: 'bg-red-500' } };
    return styles[mappedKey as keyof typeof styles] || styles.Moderate;
  };

  const tStyle = getTrafficStyle();

  // Stops always resolve to *some* coordinates so the map can render; the route
  // line itself is only drawn when `hasRoute` is true (see RouteMapView).
  const stops = (trip.routeCoordinates && trip.routeCoordinates.length > 0 ? trip.routeCoordinates : (STOPS && STOPS.length > 0 ? STOPS : [[9.03, 38.74], [9.04, 38.75], [9.05, 38.76]])) as [number, number][];
  const stopNames = trip.routeStopNames && trip.routeStopNames.length > 0 ? trip.routeStopNames : (STOP_NAMES && STOP_NAMES.length > 0 ? STOP_NAMES : ['Stop 1', 'Stop 2', 'Stop 3']);

  const mapTypeButtons: Array<{ type: MapType; label: string; icon: string }> = [
    { type: 'street', label: 'Street', icon: '🗺️' },
    { type: 'satellite', label: 'Satellite', icon: '🛰️' },
    { type: 'terrain', label: 'Terrain (3D)', icon: '⛰️' },
    { type: 'dark', label: 'Dark', icon: '🌙' },
  ];

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="h-screen w-full bg-gray-50 overflow-hidden relative flex flex-col">

      {/* ─── FULL WIDTH HEADER ────────────────────────────────── */}
      <div className="shrink-0 z-[1001] bg-gradient-to-r from-[#0B1739] via-[#12204A] to-[#2B4B9E] px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between text-white">
        <div className="flex items-center gap-3">
          <button onClick={goBack} className="bg-white/10 hover:bg-white/20 border border-white/16 rounded-xl px-3 py-1.5 text-sm font-medium flex items-center gap-2 transition-colors">
            <FaArrowLeft size={14} />
            Back
          </button>
          <div>
            <p className="text-[11px] text-white/65">{greeting}</p>
            <h1 className="font-bold text-[18px] sm:text-[20px] tracking-[-0.02em]">{driverName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex gap-1.5">
            <span className="flex items-center gap-1 bg-white/10 border border-white/14 px-2.5 py-1 rounded-full text-[11px] text-white/92">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3DDC91]" /> On duty
            </span>
            <span className="flex items-center gap-1 bg-white/10 border border-white/14 px-2.5 py-1 rounded-full text-[11px] text-white/92">
              🕒 {shiftHours}
            </span>
            <span className="flex items-center gap-1 bg-white/10 border border-white/14 px-2.5 py-1 rounded-full text-[11px] text-white/92">
              🚌 {busPlate}
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#12B2E4] to-[#2B4B9E] flex items-center justify-center font-bold text-sm border-2 border-white/30">
            {driverInitials}
          </div>
        </div>
      </div>

      {/* ─── BODY: sidebar + map share the row, sidebar pushes the map (no overlay) ─── */}
      <div className="flex-1 flex min-h-0 relative">

        {/* ─── SIDEBAR ─────────────────────────────────────────── */}
        <div
          className="shrink-0 bg-white border-r border-gray-200 shadow-sm overflow-hidden transition-[width] duration-300 ease-in-out"
          style={{ width: sidebarOpen ? SIDEBAR_WIDTH : 0 }}
        >
          <div className="h-full overflow-y-auto p-5" style={{ width: SIDEBAR_WIDTH }}>

            {/* CURRENT TRIP */}
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1 h-5 rounded-full bg-[#12B2E4]" />
                <h3 className="font-semibold text-[15px]">Current Trip</h3>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="font-bold text-[15px]">{originTerminal} → {destTerminal}</div>
                <div className="text-[13px] text-gray-500 mt-0.5">via {viaRoute}</div>
                <div className="flex gap-3 mt-3">
                  <div className="flex-1 bg-white rounded-lg p-2.5 border border-gray-100">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">ETA</div>
                    <div className="font-bold text-[15px] text-[#12B2E4]">{etaDisplay}</div>
                  </div>
                  <div className="flex-1 bg-white rounded-lg p-2.5 border border-gray-100">
                    <div className="text-[10px] text-gray-400 uppercase tracking-wider">Started</div>
                    <div className="font-bold text-[15px]">{departureTime}</div>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span className="font-semibold text-[#12B2E4]">{Math.round(progress)}%</span>
                  </div>
                  <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#12B2E4] to-[#2B4B9E] transition-all duration-700" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* ─── TRIP CONTROLS (Start / Pause / Resume / End) ──── */}
            <div className="mb-5">
              {isIdle ? (
                <button onClick={handleStartTrip} disabled={!hasActiveTrip} className={`w-full py-3.5 rounded-xl font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors ${hasActiveTrip ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/30 hover:opacity-90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                  <FaPlay size={14} /> Start Trip
                </button>
              ) : isRunning ? (
                <div className="flex gap-2.5">
                  <button onClick={handlePauseTrip} className="flex-1 py-3.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border-2 border-amber-200 font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors">
                    <FaPause size={14} /> Pause
                  </button>
                  <button onClick={handleEndTrip} className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-lg shadow-rose-500/30 hover:opacity-90">
                    <FaStop size={14} /> End
                  </button>
                </div>
              ) : isPaused ? (
                <div className="flex gap-2.5">
                  <button onClick={handleResumeTrip} className="flex-[2] py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 hover:opacity-90">
                    <FaUndo size={14} /> Resume
                  </button>
                  <button onClick={handleEndTrip} className="flex-1 py-3.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border-2 border-rose-200 font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors">
                    <FaStop size={14} /> End
                  </button>
                </div>
              ) : null}
            </div>

            <div className="h-px bg-gray-200 mb-5" />

            {/* ─── QUICK ACTIONS ──────────────────────────────────── */}
            <div>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.slice(0, 4).map((action) => (
                  <button key={action.id} onClick={() => {
                    if (action.id === 'incident') setShowIncidentModal(true);
                    else if (action.id === 'dispatch') setShowDispatchModal(true);
                    else if (action.id === 'maintenance') setShowMaintenanceModal(true);
                    else if (action.id === 'shift-handover') {
                      setShowShiftHandoverModal(true);
                      const currentBusId = activeTrip?.bus_id || busId;
                      if (currentBusId) {
                        setLoadingNextDriver(true);
                        handoversApi.getNextDriver(currentBusId, activeTrip?.shiftId)
                          .then(info => info ? setNextDriverInfo({ shiftId: info.shiftId, driverName: info.driverName, driverId: info.driverId }) : setNextDriverInfo(null))
                          .catch(() => setNextDriverInfo(null)).finally(() => setLoadingNextDriver(false));
                      }
                    }
                  }} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 bg-white hover:border-[#12B2E4]/40 hover:shadow-md transition-all">
                    <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0" style={{ background: action.bg, color: action.tint }}>{action.icon}</span>
                    <span className="text-[11px] font-semibold text-gray-700 text-left">{action.label}</span>
                  </button>
                ))}
                <button onClick={() => setShowHandoverListModal(true)} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200 bg-white hover:border-[#12B2E4]/40 hover:shadow-md transition-all col-span-2">
                  <span className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0" style={{ background: QUICK_ACTIONS[4].bg, color: QUICK_ACTIONS[4].tint }}>{QUICK_ACTIONS[4].icon}</span>
                  <span className="text-[11px] font-semibold text-gray-700">{QUICK_ACTIONS[4].label}</span>
                  {hasPendingHandover && <span className="ml-auto w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">{handovers.filter(h => h.status?.toLowerCase() === 'pending').length}</span>}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ─── SIDEBAR TOGGLE (single control, sits on the seam) ── */}
        <button
          onClick={toggleSidebar}
          aria-label={sidebarOpen ? 'Hide trip panel' : 'Show trip panel'}
          className="absolute top-4 z-[1000] w-8 h-8 rounded-lg bg-white shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 hover:text-[#12B2E4] transition-all"
          style={{ left: sidebarOpen ? SIDEBAR_WIDTH - 16 : 8 }}
        >
          {sidebarOpen ? <FaChevronLeft size={12} /> : <FaChevronRight size={12} />}
        </button>

        {/* ─── MAP (fills remaining space, sidebar no longer overlays it) ─── */}
        <div className="flex-1 relative min-w-0">
          <Suspense fallback={
            <div className="h-full w-full flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <FaSpinner className="animate-spin text-[#12B2E4] text-4xl mx-auto" />
                <p className="mt-3 text-sm text-gray-500">Loading map...</p>
              </div>
            </div>
          }>
            {mapLoaded ? (
              <RouteMapView
                position={trip.position}
                stops={stops}
                stopNames={stopNames}
                currentStop={trip.currentStop}
                progress={progress}
                following={isFollowing}
                mapType={mapType}
                onMapTypeChange={setMapType}
                onFollowToggle={() => setIsFollowing(!isFollowing)}
                onUserMove={() => {}}
                speed={speed}
                hasRoute={hasRoute}
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center bg-gray-100">
                <div className="text-center">
                  <FaSpinner className="animate-spin text-[#12B2E4] text-4xl mx-auto" />
                  <p className="mt-3 text-sm text-gray-500">Loading map...</p>
                </div>
              </div>
            )}
          </Suspense>

          {/* ─── Map Type Selector ──────────────────────────────── */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-1.5">
            {mapTypeButtons.map(({ type, label, icon }) => (
              <button key={type} onClick={() => setMapType(type)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-all flex items-center justify-center ${mapType === type ? 'bg-[#12B2E4] text-white shadow-lg shadow-[#12B2E4]/30' : 'bg-white/95 backdrop-blur-md border border-white/60 text-gray-600 hover:bg-white'}`} title={label}>{icon}</button>
            ))}
          </div>

          {/* ─── Speed Indicator ────────────────────────────────── */}
          <div className="absolute left-4 bottom-24 z-[1000] bg-white/95 backdrop-blur-md border border-white/60 rounded-xl px-4 py-2 shadow-lg flex items-center gap-3">
            <span className="text-lg font-bold text-[#12B2E4]">{speed}</span>
            <span className="text-xs text-gray-400">km/h</span>
          </div>

          {/* ─── Bottom Info Panel ──────────────────────────────── */}
          <div className="absolute bottom-0 left-0 right-0 z-[1000] bg-white/95 backdrop-blur-md border-t border-gray-200 p-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Progress</span>
              <span className="font-semibold text-[#12B2E4]">{Math.round(progress)}%</span>
            </div>
            <div className="relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-[#12B2E4] to-[#2B4B9E] transition-all duration-700" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            <div className="grid grid-cols-4 gap-2 text-xs mt-2">
              <div><p className="text-gray-400">Next Stop</p><p className="font-semibold truncate">{trip.nextStop}</p></div>
              <div><p className="text-gray-400">ETA</p><p className="font-semibold text-[#12B2E4]">{trip.etaFormatted}</p></div>
              <div><p className="text-gray-400">Distance</p><p className="font-semibold">{trip.remainingKm.toFixed(1)} km</p></div>
              <div><p className="text-gray-400">Traffic</p><p className={`font-semibold flex items-center gap-1 ${tStyle.text}`}><span className={`w-1.5 h-1.5 rounded-full ${tStyle.dot}`} />{trafficStatus.charAt(0).toUpperCase() + trafficStatus.slice(1)}</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Modals ────────────────────────────────────────────────── */}
      <EndTripModal isOpen={showEndTripModal} onClose={() => setShowEndTripModal(false)} onConfirm={handleConfirmEndTrip} />

      {/* Incident Modal */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]">
            <div className="bg-gradient-to-br from-[#12B2E4] to-[#2B4B9E] p-6 text-white relative">
              <button onClick={() => { setShowIncidentModal(false); setIncidentType(''); setIncidentDescription(''); setIncidentError(''); }} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl">×</button>
              <h3 className="text-2xl font-bold">Report Incident</h3>
              <p className="text-white/80 text-sm">Provide accurate details for dispatch.</p>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {!hasActiveTrip && <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">⚠️ Please start a trip before reporting an incident.</div>}
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Incident Type <span className="text-red-500">*</span></label>
                <select value={incidentType} onChange={(e) => setIncidentType(e.target.value)} disabled={!hasActiveTrip || submittingIncident} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#12B2E4] outline-none">
                  <option value="">Select incident type</option>
                  {INCIDENT_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Severity</label>
                <select value={incidentSeverity} onChange={(e) => setIncidentSeverity(e.target.value as any)} disabled={!hasActiveTrip || submittingIncident} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#12B2E4] outline-none">
                  <option value="low">🟢 Low</option><option value="medium">🟡 Medium</option><option value="high">🟠 High</option><option value="critical">🔴 Critical</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-red-500">*</span></label>
                <textarea value={incidentDescription} onChange={(e) => setIncidentDescription(e.target.value)} placeholder="Describe what happened…" rows={4} disabled={!hasActiveTrip || submittingIncident} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#12B2E4] outline-none resize-none" />
              </div>
              {incidentError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{incidentError}</div>}
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={() => { setShowIncidentModal(false); setIncidentType(''); setIncidentDescription(''); setIncidentError(''); }} className="flex-1 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl">Cancel</button>
              <button onClick={submitIncident} disabled={!hasActiveTrip || submittingIncident} className="flex-1 py-3 text-sm font-semibold text-white bg-[#2B4B9E] hover:bg-[#12B2E4] rounded-xl flex items-center justify-center gap-2">
                {submittingIncident ? '⏳ Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Maintenance Modal */}
      {showMaintenanceModal && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]">
            <div className="bg-gradient-to-br from-[#12B2E4] to-[#2B4B9E] p-6 text-white relative">
              <button onClick={() => { setShowMaintenanceModal(false); setMaintenanceType(''); setMaintenanceDescription(''); setMaintenanceError(''); }} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl">×</button>
              <h3 className="text-2xl font-bold">Request Maintenance</h3>
              <p className="text-white/80 text-sm">Submit a defect report for your vehicle.</p>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {!hasActiveTrip && <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">⚠️ Please start a trip before requesting maintenance.</div>}
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Maintenance Type <span className="text-red-500">*</span></label>
                <select value={maintenanceType} onChange={(e) => setMaintenanceType(e.target.value)} disabled={!hasActiveTrip || submittingMaintenance} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#12B2E4] outline-none">
                  <option value="">Select maintenance type</option>
                  {MAINTENANCE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Priority</label>
                <select value={maintenancePriority} onChange={(e) => setMaintenancePriority(e.target.value)} disabled={!hasActiveTrip || submittingMaintenance} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#12B2E4] outline-none">
                  <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option>
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Description <span className="text-red-500">*</span></label>
                <textarea value={maintenanceDescription} onChange={(e) => setMaintenanceDescription(e.target.value)} placeholder="Describe the issue…" rows={3} disabled={!hasActiveTrip || submittingMaintenance} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#12B2E4] outline-none resize-none" />
              </div>
              {maintenanceError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{maintenanceError}</div>}
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={() => { setShowMaintenanceModal(false); setMaintenanceType(''); setMaintenanceDescription(''); setMaintenanceError(''); }} className="flex-1 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl">Cancel</button>
              <button onClick={submitMaintenance} disabled={!hasActiveTrip || submittingMaintenance} className="flex-1 py-3 text-sm font-semibold text-white bg-[#2B4B9E] hover:bg-[#12B2E4] rounded-xl flex items-center justify-center gap-2">
                {submittingMaintenance ? '⏳ Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-br from-[#12B2E4] to-[#2B4B9E] p-6 text-white relative">
              <button onClick={() => setShowDispatchModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl">×</button>
              <h3 className="text-2xl font-bold">Contact Dispatch</h3>
              <p className="text-white/80 text-sm">Reach the control room right away</p>
            </div>
            <div className="p-6 space-y-4">
              <button onClick={() => { setShowDispatchModal(false); window.location.href = `tel:${DISPATCH_PHONE}`; }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[#EEF3FE] border border-[#D5E1FB] hover:bg-[#E1EAFC] transition-all">
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-[#2B6BE0] shadow-sm">📞</div>
                <div className="text-left flex-1"><h4 className="font-bold text-[13.5px]">Call control room</h4><p className="text-[12px] text-gray-500">Direct voice call to {DISPATCH_PHONE}</p></div>
                <span className="text-gray-400">→</span>
              </button>
              <button onClick={() => { setShowDispatchModal(false); setShowIncidentModal(true); }} className="w-full flex items-center gap-4 p-4 rounded-2xl bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-all">
                <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center text-rose-500 shadow-sm">🚨</div>
                <div className="text-left flex-1"><h4 className="font-bold text-[13.5px]">Report emergency</h4><p className="text-[12px] text-gray-500">Send immediate SOS to dispatch</p></div>
                <span className="text-gray-400">→</span>
              </button>
              <button onClick={() => setShowDispatchModal(false)} className="w-full py-3 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Handover List Modal */}
      <HandoverListModal isOpen={showHandoverListModal} handovers={handovers} onAccept={acceptHandover} onReject={rejectHandover} onClose={() => setShowHandoverListModal(false)} currentDriverName={driverName} loading={handoversLoading} />

      {/* Shift Handover Modal */}
      {showShiftHandoverModal && (
        <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh]">
            <div className="bg-gradient-to-br from-[#12B2E4] to-[#2B4B9E] p-6 text-white relative">
              <button onClick={() => { setShowShiftHandoverModal(false); setHandoverNotes(''); setHandoverVehicleCondition('good'); setHandoverError(''); setNextDriverInfo(null); }} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white text-xl">×</button>
              <h3 className="text-2xl font-bold">Shift Handover</h3>
              <p className="text-white/80 text-sm">Transfer vehicle keys to the next driver.</p>
            </div>
            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {!hasActiveTrip && <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm">⚠️ Please start a trip before creating a handover.</div>}
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Current Driver</label><input type="text" value={driverName} disabled className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 outline-none" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Next Driver</label>
                {loadingNextDriver ? <div className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 bg-gray-50 flex items-center gap-2">⏳ Looking up...</div> :
                  nextDriverInfo ? <div className="w-full border border-green-300 rounded-xl px-4 py-3 text-sm text-green-700 bg-green-50 flex items-center gap-2">✅ {nextDriverInfo.driverName} <span className="text-xs text-green-500 ml-auto">Auto-assigned</span></div> :
                  <div className="w-full border border-amber-300 rounded-xl px-4 py-3 text-sm text-amber-700 bg-amber-50">No next driver assigned. Contact admin.</div>}
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Vehicle Condition</label>
                <select value={handoverVehicleCondition} onChange={(e) => setHandoverVehicleCondition(e.target.value)} disabled={!hasActiveTrip || submittingHandover} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#12B2E4] outline-none">
                  {VEHICLE_CONDITIONS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                </select>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Handover Notes</label>
                <textarea value={handoverNotes} onChange={(e) => setHandoverNotes(e.target.value)} placeholder="Any important information…" rows={3} disabled={!hasActiveTrip || submittingHandover} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#12B2E4] outline-none resize-none" />
              </div>
              {handoverError && <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{handoverError}</div>}
            </div>
            <div className="p-6 pt-0 flex gap-3">
              <button onClick={() => { setShowShiftHandoverModal(false); setHandoverNotes(''); setHandoverVehicleCondition('good'); setHandoverError(''); setNextDriverInfo(null); }} className="flex-1 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl">Cancel</button>
              <button onClick={submitShiftHandover} disabled={!hasActiveTrip || submittingHandover} className="flex-1 py-3 text-sm font-semibold text-white bg-[#2B4B9E] hover:bg-[#12B2E4] rounded-xl flex items-center justify-center gap-2">
                {submittingHandover ? '⏳ Submitting...' : 'Complete Handover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RouteMapPage;