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
import { useTrips, useIncidents, useMaintenance, useHandovers } from '../hooks';
import { formatDate } from '../utils';
import { TabType, Trip } from '../types';

const ITEMS_PER_PAGE = 9;

const MyTripHistory: React.FC = () => {
  // ─── Hooks ──────────────────────────────────────────────────────
  const { filteredTrips, totalTrips, completedTrips, totalDistance, mostRecentDate, uniqueRoutes, filterTrips } = useTrips();
  const { incidents } = useIncidents();
  const { requests } = useMaintenance();
  const { handovers } = useHandovers();

  // ─── State ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<TabType>("trips");
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedRoute, setSelectedRoute] = useState("All Routes");
  const [startDate, setStartDate] = useState("2026-01-15");
  const [endDate, setEndDate] = useState("2026-02-15");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ─── Apply filters when they change ────────────────────────────
  useEffect(() => {
    filterTrips({ search, status: selectedStatus, route: selectedRoute, startDate, endDate });
    setCurrentPage(1);
  }, [search, selectedStatus, selectedRoute, startDate, endDate, filterTrips]);

  // ─── Handlers ──────────────────────────────────────────────────
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedStatus("All Status");
    setSelectedRoute("All Routes");
    setStartDate("2026-01-15");
    setEndDate("2026-02-15");
    setCurrentPage(1);
    filterTrips({ search: "", status: "All Status", route: "All Routes", startDate: "2026-01-15", endDate: "2026-02-15" });
  };

  const handleExportCSV = () => {
    // Export logic here
    setShowExportModal(false);
  };

  const handleExportStyled = () => {
    // Export styled logic here
    setShowExportModal(false);
  };

  const formatDateLabel = (dateStr: string) => {
    return formatDate(dateStr, mostRecentDate);
  };

  // ─── Pagination ────────────────────────────────────────────────
  const paginatedTrips = filteredTrips.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const totalPages = Math.max(1, Math.ceil(filteredTrips.length / ITEMS_PER_PAGE));

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen p-3 sm:p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
          <div>
            <div className="flex items-center gap-2">
              <FaClipboardList className="text-[#12B2E4]" size={20} />
              <h1 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white">MyTripHistory</h1>
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

        {/* Tabs */}
        <HistoryTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          counts={{ trips: totalTrips, incidents: incidents.length, maintenance: requests.length, handovers: handovers.length }}
        />

        {/* Content */}
        {activeTab === "trips" && (
          <>
            <HistoryStats totalTrips={totalTrips} completedTrips={completedTrips} totalDistance={totalDistance} />
            
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
            />

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <TripHistoryTable trips={paginatedTrips} onViewTrip={setSelectedTrip} formatDate={formatDateLabel} />
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
            <IncidentHistoryTable incidents={incidents} />
          </div>
        )}

        {activeTab === "maintenance" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden p-4">
            <MaintenanceHistoryTable requests={requests} />
          </div>
        )}

        {activeTab === "handovers" && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden p-4">
            <HandoverHistoryTable handovers={handovers} />
          </div>
        )}
      </div>

      {/* Modals */}
      <TripDetailModal trip={selectedTrip} onClose={() => setSelectedTrip(null)} />
      
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