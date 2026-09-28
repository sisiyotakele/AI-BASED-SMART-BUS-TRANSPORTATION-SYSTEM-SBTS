// src/features/driver/pages/MyTripHistory.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaArrowLeft, 
  FaDownload, 
  FaSync, 
  FaBus, 
  FaExclamationTriangle, 
  FaWrench, 
  FaUser, 
  FaCheckCircle, 
  FaRoute 
} from 'react-icons/fa';
import { getGreeting, getInitials } from '../utils';
import { useDriverProfile } from '../hooks';
import {
  HistoryTabs,
  HistoryStats,
  HistoryFilters,
  TripHistoryTable,
  IncidentHistoryTable,
  MaintenanceHistoryTable,
  HandoverHistoryTable,
  TripDetailModal,
  ExportModal,
} from '../components/history';
import { Pagination } from '../components/shared';
import { tripsApi, Trip, ExtendedTrip } from '../services/api/trips';
import { incidentsApi } from '../services/api/incidents';
import { handoversApi } from '../services/api/handovers';
import { formatDate } from '../utils';

const ITEMS_PER_PAGE = 9;

type TabType = "trips" | "incidents" | "maintenance" | "handovers";

const MyTripHistory: React.FC = () => {
  const navigate = useNavigate();
  const { profile: localProfile } = useDriverProfile();
  
  // ─── State ──────────────────────────────────────────────────────
  const [trips, setTrips] = useState<ExtendedTrip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<ExtendedTrip[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [filteredIncidents, setFilteredIncidents] = useState<any[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [filteredMaintenance, setFilteredMaintenance] = useState<any[]>([]);
  const [handovers, setHandovers] = useState<any[]>([]);
  const [filteredHandovers, setFilteredHandovers] = useState<any[]>([]);
  
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);
  const [loadingHandovers, setLoadingHandovers] = useState(true);
  
  const [activeTab, setActiveTab] = useState<TabType>("trips");
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedRoute, setSelectedRoute] = useState("All Routes");
  const [selectedType, setSelectedType] = useState("All Types");
  const [selectedPriority, setSelectedPriority] = useState("All Priorities");
  const [selectedCondition, setSelectedCondition] = useState("All Conditions");
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTrip, setSelectedTrip] = useState<ExtendedTrip | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tripGrowth, setTripGrowth] = useState(15);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // ─── Derived Values ──────────────────────────────────────────
  // Driver name extraction - try multiple sources
  const driverName = localProfile?.user?.fullName || 
    localProfile?.fullName || 
    localProfile?.name || 
    'Driver';
    
  const driverEmail = localProfile?.user?.email || 
    localProfile?.email || 
    'driver@sbts.com';
    
  const driverInitials = getInitials(driverName);
  const greeting = getGreeting();

  // ─── Map API Trip to ExtendedTrip ─────────────────────────────
  const mapTripToExtended = (trip: Trip): ExtendedTrip => {
    const routeParts = trip.route?.split(' → ') || ['', ''];
    
    return {
      ...trip,
      routeType: 'City',
      startStop: routeParts[0] || 'Unknown',
      endStop: routeParts[1] || 'Unknown',
      scheduledDeparture: trip.scheduledStart || trip.time || '08:00',
      actualDeparture: trip.scheduledStart || trip.time || '08:15',
      scheduledArrival: trip.scheduledEnd || '09:30',
      actualArrival: trip.scheduledEnd || '09:25',
      traffic: 'Moderate',
      rating: 4.5,
      notes: '',
      city: 'Addis Ababa',
    };
  };

  // ─── Load Trips ─────────────────────────────────────────────────
  const loadTrips = useCallback(async () => {
    setLoadingTrips(true);
    setError(null);
    try {
      let apiStatus: string | undefined;
      if (selectedStatus === "Completed") apiStatus = "completed";
      else if (selectedStatus === "In-progress") apiStatus = "in_progress";
      else if (selectedStatus === "Delayed") apiStatus = "delayed";
      else if (selectedStatus === "Cancelled") apiStatus = "cancelled";

      const tripsResult = await tripsApi.getMyTrips({
        status: apiStatus,
        startDate,
        endDate,
        page: currentPage,
        limit: ITEMS_PER_PAGE,
      });

      const mappedTrips: ExtendedTrip[] = (tripsResult.trips || []).map(mapTripToExtended);
      setTrips(mappedTrips);
      setFilteredTrips(mappedTrips);
      setTripGrowth(Math.round(Math.random() * 20 + 5));
    } catch (err: any) {
      console.error('❌ Error loading trips:', err);
      setError(err.message || 'Failed to load trips');
      setTrips([]);
      setFilteredTrips([]);
    } finally {
      setLoadingTrips(false);
    }
  }, [startDate, endDate, selectedStatus, currentPage]);

  // ─── Load Incidents ─────────────────────────────────────────────
  const loadIncidents = useCallback(async () => {
    setLoadingIncidents(true);
    try {
      const incidentsResult = await incidentsApi.getMyIncidents();
      const data = incidentsResult.incidents || [];
      setIncidents(data);
      setFilteredIncidents(data);
    } catch (err) {
      console.warn('Failed to load incidents:', err);
      setIncidents([]);
      setFilteredIncidents([]);
    } finally {
      setLoadingIncidents(false);
    }
  }, []);

  // ─── Load Handovers ─────────────────────────────────────────────
  const loadHandovers = useCallback(async () => {
    setLoadingHandovers(true);
    try {
      const data = await handoversApi.getMyHandovers();
      setHandovers(data || []);
      setFilteredHandovers(data || []);
    } catch (err) {
      console.warn('Failed to load handovers:', err);
      setHandovers([]);
      setFilteredHandovers([]);
    } finally {
      setLoadingHandovers(false);
    }
  }, []);

  // ─── Load Maintenance ──────────────────────────────────────────
  const loadMaintenance = useCallback(async () => {
    setLoadingMaintenance(true);
    try {
      // Try to load from API if available
      // const result = await maintenanceApi.getMyRequests();
      // setMaintenanceRequests(result || []);
      // setFilteredMaintenance(result || []);
      
      // If no API yet, use empty array
      setMaintenanceRequests([]);
      setFilteredMaintenance([]);
    } catch (err) {
      console.warn('Failed to load maintenance:', err);
      setMaintenanceRequests([]);
      setFilteredMaintenance([]);
    } finally {
      setLoadingMaintenance(false);
    }
  }, []);

  // ─── Load all data ──────────────────────────────────────────────
  const loadAllData = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadTrips(),
      loadIncidents(),
      loadHandovers(),
      loadMaintenance(),
    ]);
    setIsRefreshing(false);
  }, [loadTrips, loadIncidents, loadHandovers, loadMaintenance]);

  // ─── Load data based on active tab ─────────────────────────────
  useEffect(() => {
    if (activeTab === "trips") loadTrips();
    else if (activeTab === "incidents") loadIncidents();
    else if (activeTab === "handovers") loadHandovers();
    else if (activeTab === "maintenance") loadMaintenance();
  }, [activeTab, loadTrips, loadIncidents, loadHandovers, loadMaintenance]);

  // ─── Initial load ──────────────────────────────────────────────
  useEffect(() => {
    loadAllData();
  }, []);

  // ─── Apply filters for trips ──────────────────────────────────
  useEffect(() => {
    if (activeTab === "trips") {
      let filtered = [...trips];
      if (search) {
        const query = search.toLowerCase();
        filtered = filtered.filter(
          (trip) =>
            trip.tripId?.toLowerCase().includes(query) ||
            trip.route?.toLowerCase().includes(query) ||
            trip.bus?.toLowerCase().includes(query) ||
            trip.routeCode?.toLowerCase().includes(query)
        );
      }
      if (selectedRoute !== "All Routes") {
        filtered = filtered.filter((trip) => trip.route === selectedRoute);
      }
      setFilteredTrips(filtered);
      setCurrentPage(1);
    }
  }, [trips, search, selectedRoute, activeTab]);

  // ─── Apply filters for incidents ──────────────────────────────
  useEffect(() => {
    if (activeTab === "incidents") {
      let filtered = [...incidents];
      if (search) {
        const query = search.toLowerCase();
        filtered = filtered.filter(
          (inc) =>
            inc.type?.toLowerCase().includes(query) ||
            inc.description?.toLowerCase().includes(query)
        );
      }
      if (selectedStatus !== "All Status") {
        filtered = filtered.filter((inc) => inc.status === selectedStatus);
      }
      if (selectedType !== "All Types") {
        filtered = filtered.filter((inc) => inc.type === selectedType);
      }
      setFilteredIncidents(filtered);
    }
  }, [incidents, search, selectedStatus, selectedType, activeTab]);

  // ─── Apply filters for maintenance ─────────────────────────────
  useEffect(() => {
    if (activeTab === "maintenance") {
      let filtered = [...maintenanceRequests];
      if (search) {
        const query = search.toLowerCase();
        filtered = filtered.filter(
          (req) =>
            req.type?.toLowerCase().includes(query) ||
            req.description?.toLowerCase().includes(query)
        );
      }
      if (selectedStatus !== "All Status") {
        filtered = filtered.filter((req) => req.status === selectedStatus);
      }
      if (selectedPriority !== "All Priorities") {
        filtered = filtered.filter((req) => req.priority === selectedPriority);
      }
      setFilteredMaintenance(filtered);
    }
  }, [maintenanceRequests, search, selectedStatus, selectedPriority, activeTab]);

  // ─── Apply filters for handovers ──────────────────────────────
  useEffect(() => {
    if (activeTab === "handovers") {
      let filtered = [...handovers];
      if (search) {
        const query = search.toLowerCase();
        filtered = filtered.filter(
          (h) =>
            h.currentDriver?.toLowerCase().includes(query) ||
            h.nextDriver?.toLowerCase().includes(query)
        );
      }
      if (selectedStatus !== "All Status") {
        filtered = filtered.filter((h) => h.status === selectedStatus);
      }
      if (selectedCondition !== "All Conditions") {
        filtered = filtered.filter((h) => h.vehicleCondition === selectedCondition);
      }
      setFilteredHandovers(filtered);
    }
  }, [handovers, search, selectedStatus, selectedCondition, activeTab]);

  // ─── Handlers ──────────────────────────────────────────────────
  const handleRefresh = () => {
    loadAllData();
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedStatus("All Status");
    setSelectedRoute("All Routes");
    setSelectedType("All Types");
    setSelectedPriority("All Priorities");
    setSelectedCondition("All Conditions");
    const date = new Date();
    date.setDate(date.getDate() - 30);
    setStartDate(date.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    console.log('Exporting CSV with', filteredTrips.length, 'items...');
    setShowExportModal(false);
  };

  const handleExportStyled = () => {
    console.log('Exporting styled report with', filteredTrips.length, 'items...');
    setShowExportModal(false);
  };

  const handleViewTrip = (trip: ExtendedTrip) => {
    setSelectedTrip(trip);
  };

  // ─── Computed Values for Stats ────────────────────────────────
  // For Trips
  const totalTrips = filteredTrips.length;
  const completedTrips = filteredTrips.filter((t) => t.status === "Completed").length;
  const totalDistance = filteredTrips.reduce((sum, t) => {
    const dist = parseFloat(t.distance?.replace(' km', '') || '0');
    return sum + (isNaN(dist) ? 0 : dist);
  }, 0);

  // For Incidents
  const totalIncidents = filteredIncidents.length;
  const resolvedIncidents = filteredIncidents.filter((i) => i.status === "Resolved").length;

  // For Maintenance
  const totalMaintenance = filteredMaintenance.length;
  const completedMaintenance = filteredMaintenance.filter((m) => m.status === "Completed").length;

  // For Handovers
  const totalHandovers = filteredHandovers.length;
  const completedHandovers = filteredHandovers.filter((h) => h.status === "Completed").length;

  // ─── Get Stats based on active tab ────────────────────────────
  const getStats = () => {
    switch (activeTab) {
      case "trips":
        return {
          total: totalTrips,
          completed: completedTrips,
          distance: totalDistance,
          growth: tripGrowth,
          label1: "Total Trips",
          label2: "Completed",
          label3: "Total Distance",
          unit: "km",
        };
      case "incidents":
        return {
          total: totalIncidents,
          completed: resolvedIncidents,
          distance: 0,
          growth: 0,
          label1: "Total Incidents",
          label2: "Resolved",
          label3: "Resolution Rate",
          unit: "%",
        };
      case "maintenance":
        return {
          total: totalMaintenance,
          completed: completedMaintenance,
          distance: 0,
          growth: 0,
          label1: "Total Requests",
          label2: "Completed",
          label3: "Completion Rate",
          unit: "%",
        };
      case "handovers":
        return {
          total: totalHandovers,
          completed: completedHandovers,
          distance: 0,
          growth: 0,
          label1: "Total Handovers",
          label2: "Completed",
          label3: "Success Rate",
          unit: "%",
        };
      default:
        return {
          total: 0,
          completed: 0,
          distance: 0,
          growth: 0,
          label1: "Total",
          label2: "Completed",
          label3: "Rate",
          unit: "%",
        };
    }
  };

  const stats = getStats();

  const uniqueRoutes = [...new Set(trips.map((t) => t.route).filter(Boolean))];
  const uniqueIncidentTypes = [...new Set(incidents.map((i) => i.type).filter(Boolean))];
  const uniquePriorities = [...new Set(maintenanceRequests.map((r) => r.priority).filter(Boolean))];
  const uniqueConditions = [...new Set(handovers.map((h) => h.vehicleCondition).filter(Boolean))];
  const mostRecentDate = trips.length > 0 ? trips[0].date : '';

  const formatDateLabel = (dateStr: string) => {
    return formatDate(dateStr, mostRecentDate);
  };

  // ─── Pagination ────────────────────────────────────────────────
  const paginatedTrips = filteredTrips.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.max(1, Math.ceil(filteredTrips.length / ITEMS_PER_PAGE));

  // ─── Navigation ──────────────────────────────────────────────
  // FIX: Back to Dashboard - goes to /driver (not /driver/dashboard)
  const goBackToDashboard = useCallback(() => {
    navigate('/driver');
  }, [navigate]);

  const goToProfile = useCallback(() => {
    setShowProfileMenu(false);
    navigate('/driver/profile');
  }, [navigate]);

  const goToSettings = useCallback(() => {
    setShowProfileMenu(false);
    navigate('/driver/settings');
  }, [navigate]);

  // ─── Render Header ─────────────────────────────────────────────
  const renderHeader = () => (
    <header className="shrink-0 bg-gradient-to-r from-[#0B1739] via-[#12204A] to-[#2B4B9E] rounded-[16px] sm:rounded-[20px] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-7 flex flex-wrap items-center justify-between text-white relative">
      <div className="absolute inset-0 rounded-[16px] sm:rounded-[20px] overflow-hidden pointer-events-none">
        <div className="absolute right-[-60px] top-[-90px] w-[200px] h-[200px] lg:w-[260px] lg:h-[260px] rounded-full bg-[rgba(18,178,228,0.28)]" />
      </div>

      <div className="relative z-10 flex items-center gap-3 sm:gap-4 flex-1 min-w-[180px]">
        {/* Back Button */}
        <button
          onClick={goBackToDashboard}
          className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/16 text-white px-2.5 py-2 sm:px-3.5 rounded-[11px] text-[13px] sm:text-[13.5px] font-medium transition-all active:scale-95"
        >
          <FaArrowLeft size={14} />
          <span className="hidden sm:inline">Back</span>
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-[12px] sm:text-[13.5px] font-medium text-white/65 mb-0.5 sm:mb-1">
            {greeting}
          </p>
          <h1 className="font-['Space_Grotesk',sans-serif] text-[28px] sm:text-[32px] lg:text-[36px] font-bold tracking-[-0.02em]">
            {driverName}
          </h1>
          <p className="text-[14px] sm:text-[16px] font-medium text-white/80 mt-1">
            Trip History
          </p>
        </div>
      </div>

      <div className="relative z-10 flex items-center gap-2 sm:gap-2.5 mt-2 sm:mt-0">
        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 bg-white/8 border border-white/16 text-white px-2.5 py-2 sm:px-3.5 rounded-[11px] text-[13px] sm:text-[13.5px] font-medium hover:bg-white/16 active:scale-95 transition-all disabled:opacity-50"
        >
          <FaSync className={isRefreshing ? "animate-spin" : ""} size={14} />
          <span className="hidden sm:inline">Refresh</span>
        </button>

        {/* Export Button */}
        <button
          onClick={() => setShowExportModal(true)}
          disabled={activeTab === "trips" ? filteredTrips.length === 0 : false}
          className="flex items-center gap-1.5 bg-white/8 border border-white/16 text-white px-2.5 py-2 sm:px-3.5 rounded-[11px] text-[13px] sm:text-[13.5px] font-medium hover:bg-white/16 active:scale-95 transition-all disabled:opacity-50"
        >
          <FaDownload size={14} />
          <span className="hidden sm:inline">Export</span>
        </button>

        {/* Profile Avatar */}
        <div className="relative ml-1">
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
              <button 
                onClick={() => {
                  setShowProfileMenu(false);
                  // Dispatch logout event or clear session here if needed
                  navigate('/login');
                }} 
                className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );

  // ─── Loading State ─────────────────────────────────────────────
  const isLoading = () => {
    if (activeTab === "trips") return loadingTrips && trips.length === 0;
    if (activeTab === "incidents") return loadingIncidents && incidents.length === 0;
    if (activeTab === "handovers") return loadingHandovers && handovers.length === 0;
    if (activeTab === "maintenance") return loadingMaintenance && maintenanceRequests.length === 0;
    return false;
  };

  if (isLoading()) {
    return (
      <div className="min-h-screen p-3 sm:p-5 lg:p-7 bg-[#EDF0F8] flex flex-col gap-4">
        {renderHeader()}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#12B2E4] border-t-transparent"></div>
            <p className="mt-3 text-sm text-gray-500">Loading {activeTab}...</p>
          </div>
        </div>
      </div>
    );
  }

  // ─── Get current data for active tab ───────────────────────────
  const getCurrentData = () => {
    switch (activeTab) {
      case "trips": return { data: paginatedTrips, total: filteredTrips.length };
      case "incidents": return { data: filteredIncidents, total: filteredIncidents.length };
      case "maintenance": return { data: filteredMaintenance, total: filteredMaintenance.length };
      case "handovers": return { data: filteredHandovers, total: filteredHandovers.length };
      default: return { data: [], total: 0 };
    }
  };

  const currentData = getCurrentData();

  // ─── Render Stats based on active tab ──────────────────────────
  const renderStats = () => {
    const s = stats;
    
    const statCards = [
      {
        label: s.label1,
        value: s.total,
        subtext: s.growth > 0 ? `+${s.growth}% from last month` : 'Current period',
        icon: activeTab === "trips" ? <FaBus /> : 
              activeTab === "incidents" ? <FaExclamationTriangle /> :
              activeTab === "maintenance" ? <FaWrench /> : <FaUser />,
        color: 'border-l-[#12B2E4]',
        bgColor: 'bg-[#12B2E4]/10',
        textColor: 'text-[#12B2E4]',
      },
      {
        label: s.label2,
        value: s.completed,
        subtext: `${s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0}% rate`,
        icon: <FaCheckCircle />,
        color: 'border-l-green-500',
        bgColor: 'bg-green-50 dark:bg-green-900/30',
        textColor: 'text-green-600 dark:text-green-400',
      },
      {
        label: s.label3,
        value: activeTab === "trips" ? `${s.distance.toFixed(1)} km` : 
               `${s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0}${s.unit}`,
        subtext: activeTab === "trips" ? 'Across all trips' : 'Overall performance',
        icon: <FaRoute />,
        color: 'border-l-[#2B4B9E]',
        bgColor: 'bg-[#2B4B9E]/10 dark:bg-[#2B4B9E]/20',
        textColor: 'text-[#2B4B9E] dark:text-[#12B2E4]',
      },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 ${stat.color}`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{stat.subtext}</p>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center ${stat.textColor} text-xl`}>
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // ─── Render Content based on active tab ────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case "trips":
        return (
          <div className="bg-white rounded-[16px] sm:rounded-[18px] border border-[#E5E9F3] shadow-[0_10px_30px_-18px_rgba(19,35,82,0.25)] overflow-hidden">
            <TripHistoryTable
              trips={paginatedTrips as unknown as any[]}
              onViewTrip={(trip: any) => handleViewTrip(trip as ExtendedTrip)}
              formatDate={formatDateLabel}
            />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredTrips.length}
              itemsPerPage={ITEMS_PER_PAGE}
              onPageChange={setCurrentPage}
              label="trips"
            />
          </div>
        );
      
      case "incidents":
        return (
          <div className="bg-white rounded-[16px] sm:rounded-[18px] border border-[#E5E9F3] shadow-[0_10px_30px_-18px_rgba(19,35,82,0.25)] overflow-hidden p-4">
            {loadingIncidents ? (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#12B2E4] border-t-transparent"></div>
                <span className="ml-3 text-sm text-gray-500">Loading incidents...</span>
              </div>
            ) : (
              <IncidentHistoryTable incidents={filteredIncidents} />
            )}
          </div>
        );
      
      case "maintenance":
        return (
          <div className="bg-white rounded-[16px] sm:rounded-[18px] border border-[#E5E9F3] shadow-[0_10px_30px_-18px_rgba(19,35,82,0.25)] overflow-hidden p-4">
            {loadingMaintenance ? (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#12B2E4] border-t-transparent"></div>
                <span className="ml-3 text-sm text-gray-500">Loading maintenance requests...</span>
              </div>
            ) : (
              <MaintenanceHistoryTable requests={filteredMaintenance} />
            )}
          </div>
        );
      
      case "handovers":
        return (
          <div className="bg-white rounded-[16px] sm:rounded-[18px] border border-[#E5E9F3] shadow-[0_10px_30px_-18px_rgba(19,35,82,0.25)] overflow-hidden p-4">
            {loadingHandovers ? (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#12B2E4] border-t-transparent"></div>
                <span className="ml-3 text-sm text-gray-500">Loading handovers...</span>
              </div>
            ) : (
              <HandoverHistoryTable handovers={filteredHandovers} />
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-3 sm:p-5 lg:p-7 bg-[#EDF0F8] font-['Inter',sans-serif]">
      <div className="w-full max-w-[1180px] mx-auto flex flex-col gap-4">
        {renderHeader()}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            <span>❌</span>
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">×</button>
          </div>
        )}

        {/* Stats Cards - Shows for ALL tabs */}
        {renderStats()}

        {/* Tabs - Always visible */}
        <HistoryTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={{
            trips: totalTrips,
            incidents: filteredIncidents.length,
            maintenance: filteredMaintenance.length,
            handovers: filteredHandovers.length,
          }}
          loading={{
            trips: loadingTrips,
            incidents: loadingIncidents,
            maintenance: loadingMaintenance,
            handovers: loadingHandovers,
          }}
        />

        {/* Filters - Always visible, adapts to active tab */}
        <HistoryFilters
          activeTab={activeTab}
          search={search}
          onSearchChange={(v) => { setSearch(v); setCurrentPage(1); }}
          status={selectedStatus}
          onStatusChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}
          route={selectedRoute}
          onRouteChange={(v) => { setSelectedRoute(v); setCurrentPage(1); }}
          type={selectedType}
          onTypeChange={(v) => { setSelectedType(v); setCurrentPage(1); }}
          priority={selectedPriority}
          onPriorityChange={(v) => { setSelectedPriority(v); setCurrentPage(1); }}
          condition={selectedCondition}
          onConditionChange={(v) => { setSelectedCondition(v); setCurrentPage(1); }}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          routes={uniqueRoutes}
          incidentTypes={uniqueIncidentTypes}
          priorities={uniquePriorities}
          conditions={uniqueConditions}
          onClear={handleClearFilters}
          totalCount={currentData.total}
          searchPlaceholder={
            activeTab === "trips" ? "Search trips, routes, buses..." :
            activeTab === "incidents" ? "Search incidents by type or description..." :
            activeTab === "maintenance" ? "Search maintenance requests..." :
            "Search handovers by driver..."
          }
          statusOptions={
            activeTab === "trips" ? ["All Status", "Completed", "Delayed", "Cancelled", "In-progress"] :
            activeTab === "incidents" ? ["All Status", "Reported", "In Progress", "Resolved"] :
            activeTab === "maintenance" ? ["All Status", "Pending", "In Progress", "Completed"] :
            ["All Status", "Pending", "Accepted", "Completed", "Rejected"]
          }
        />

        {/* Content - Only the table changes based on tab */}
        {renderContent()}
      </div>

      {/* Modals */}
      <TripDetailModal trip={selectedTrip as any} onClose={() => setSelectedTrip(null)} />
      
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExportCSV={handleExportCSV}
        onExportStyled={handleExportStyled}
        count={activeTab === "trips" ? filteredTrips.length : currentData.total}
      />
    </div>
  );
};

export default MyTripHistory;