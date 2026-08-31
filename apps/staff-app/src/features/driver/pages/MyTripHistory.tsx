// src/features/driver/pages/MyTripHistory.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { FaClipboardList, FaCalendarAlt, FaBus, FaCheckCircle, FaDownload, FaSync } from 'react-icons/fa';
import Button from '../components/Button';
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

// Tab type
type TabType = "trips" | "incidents" | "maintenance" | "handovers";

const MyTripHistory: React.FC = () => {
  // ─── State ──────────────────────────────────────────────────────
  const [trips, setTrips] = useState<ExtendedTrip[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<ExtendedTrip[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<any[]>([]);
  const [handovers, setHandovers] = useState<any[]>([]);
  
  // Loading states for each tab
  const [loadingTrips, setLoadingTrips] = useState(true);
  const [loadingIncidents, setLoadingIncidents] = useState(true);
  const [loadingMaintenance, setLoadingMaintenance] = useState(true);
  const [loadingHandovers, setLoadingHandovers] = useState(true);
  
  const [activeTab, setActiveTab] = useState<TabType>("trips");
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedRoute, setSelectedRoute] = useState("All Routes");
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
  const [tripGrowth, setTripGrowth] = useState(15); // Growth percentage from API

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
      
      // Calculate trip growth (mock for now - replace with real API data)
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
      setIncidents(incidentsResult.incidents || []);
    } catch (err) {
      console.warn('Failed to load incidents:', err);
      setIncidents([]);
    } finally {
      setLoadingIncidents(false);
    }
  }, []);

  // ─── Load Handovers ─────────────────────────────────────────────
  const loadHandovers = useCallback(async () => {
    setLoadingHandovers(true);
    try {
      const handoversResult = await handoversApi.getMyHandovers();
      setHandovers(handoversResult || []);
    } catch (err) {
      console.warn('Failed to load handovers:', err);
      setHandovers([]);
    } finally {
      setLoadingHandovers(false);
    }
  }, []);

  // ─── Load Maintenance (API not available yet) ──────────────────
  const loadMaintenance = useCallback(async () => {
    setLoadingMaintenance(true);
    try {
      // When maintenance API is available, replace this with:
      // const result = await maintenanceApi.getMyRequests();
      // setMaintenanceRequests(result || []);
      
      // For now, use empty array with a message
      setMaintenanceRequests([]);
    } catch (err) {
      console.warn('Failed to load maintenance:', err);
      setMaintenanceRequests([]);
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

  // ─── Apply local filters (search, route) ──────────────────────
  useEffect(() => {
    if (activeTab !== "trips") return;
    
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
      filtered = filtered.filter(
        (trip) => trip.route === selectedRoute
      );
    }

    setFilteredTrips(filtered);
    setCurrentPage(1);
  }, [trips, search, selectedRoute, activeTab]);

  // ─── Handlers ──────────────────────────────────────────────────
  const handleRefresh = () => {
    loadAllData();
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedStatus("All Status");
    setSelectedRoute("All Routes");
    const date = new Date();
    date.setDate(date.getDate() - 30);
    setStartDate(date.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    console.log('Exporting CSV with', filteredTrips.length, 'trips...');
    setShowExportModal(false);
  };

  const handleExportStyled = () => {
    console.log('Exporting styled report with', filteredTrips.length, 'trips...');
    setShowExportModal(false);
  };

  const handleViewTrip = (trip: ExtendedTrip) => {
    setSelectedTrip(trip);
  };

  // ─── Computed Values ───────────────────────────────────────────
  const totalTrips = filteredTrips.length;
  const completedTrips = filteredTrips.filter((t) => t.status === "Completed").length;
  const totalDistance = filteredTrips.reduce((sum, t) => {
    const dist = parseFloat(t.distance?.replace(' km', '') || '0');
    return sum + (isNaN(dist) ? 0 : dist);
  }, 0);

  const uniqueRoutes = [...new Set(trips.map((t) => t.route).filter(Boolean))];
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
      <div className="min-h-screen p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#12B2E4] border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Loading {activeTab}...
          </p>
        </div>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-3 sm:p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
          <div>
            <div className="flex items-center gap-2">
              <FaClipboardList className="text-[#12B2E4]" size={20} />
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">My Trip History</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              <span className="flex items-center gap-1"><FaCalendarAlt size={12} /> Last 30 Days</span>
              <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>
              <span className="flex items-center gap-1"><FaBus size={12} /> {totalTrips} Total Trips</span>
              <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400"><FaCheckCircle size={12} /> {completedTrips} Completed</span>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {activeTab === "trips" && (
              <Button
                text="Export"
                variant="primary"
                size="sm"
                icon={<FaDownload size={12} />}
                onClick={() => setShowExportModal(true)}
                disabled={filteredTrips.length === 0}
              />
            )}
            <Button
              text="Refresh"
              variant="outline"
              size="sm"
              icon={<FaSync size={12} className={isRefreshing ? "animate-spin" : ""} />}
              onClick={handleRefresh}
              disabled={isRefreshing}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 mb-4 font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <span>❌</span>
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-700 dark:text-red-400 hover:text-red-900"
            >
              ×
            </button>
          </div>
        )}

        {/* Tabs */}
        <HistoryTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={{
            trips: totalTrips,
            incidents: incidents.length,
            maintenance: maintenanceRequests.length,
            handovers: handovers.length,
          }}
        />

        {/* Content */}
        {activeTab === "trips" && (
          <>
            <HistoryStats
              totalTrips={totalTrips}
              completedTrips={completedTrips}
              totalDistance={totalDistance}
              tripGrowth={tripGrowth}
            />
            
            <HistoryFilters
              search={search}
              onSearchChange={(v) => { setSearch(v); setCurrentPage(1); }}
              status={selectedStatus}
              onStatusChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}
              route={selectedRoute}
              onRouteChange={(v) => { setSelectedRoute(v); setCurrentPage(1); }}
              startDate={startDate}
              onStartDateChange={setStartDate}
              endDate={endDate}
              onEndDateChange={setEndDate}
              routes={uniqueRoutes}
              onClear={handleClearFilters}
              totalCount={filteredTrips.length}
              searchPlaceholder="Search trips, routes, buses..."
              showRouteFilter={true}
              statusOptions={["All Status", "Completed", "Delayed", "Cancelled", "In-progress"]}
            />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
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
          </>
        )}

        {activeTab === "incidents" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden p-4">
            {loadingIncidents ? (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#12B2E4] border-t-transparent"></div>
                <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">Loading incidents...</span>
              </div>
            ) : (
              <IncidentHistoryTable incidents={incidents} />
            )}
          </div>
        )}

        {activeTab === "maintenance" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden p-4">
            {loadingMaintenance ? (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#12B2E4] border-t-transparent"></div>
                <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">Loading maintenance requests...</span>
              </div>
            ) : (
              <MaintenanceHistoryTable requests={maintenanceRequests} />
            )}
          </div>
        )}

        {activeTab === "handovers" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden p-4">
            {loadingHandovers ? (
              <div className="flex items-center justify-center py-8">
                <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-[#12B2E4] border-t-transparent"></div>
                <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">Loading handovers...</span>
              </div>
            ) : (
              <HandoverHistoryTable handovers={handovers} />
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <TripDetailModal trip={selectedTrip as any} onClose={() => setSelectedTrip(null)} />
      
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExportCSV={handleExportCSV}
        onExportStyled={handleExportStyled}
        count={filteredTrips.length}
      />
    </div>
  );
};

export default MyTripHistory;