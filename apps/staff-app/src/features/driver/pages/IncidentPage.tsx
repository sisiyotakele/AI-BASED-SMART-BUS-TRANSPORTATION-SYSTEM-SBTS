// src/features/driver/pages/IncidentPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  IncidentForm,
  IncidentList,
  IncidentFilters,
  IncidentStats,
} from '../components/incident';
import { IncidentModal } from '../components/modals';
import { useIncidents, useGeolocation } from '../hooks';
import { INCIDENT_TYPES } from '../constants';

const ITEMS_PER_PAGE = 9;

const STATUS_OPTIONS = ["All Status", "Reported", "In Progress", "Resolved"];
const TYPE_OPTIONS = ["All Types", ...INCIDENT_TYPES];

const IncidentPage: React.FC = () => {
  // ─── Hooks ──────────────────────────────────────────────────────
  const { incidents, loadIncidents } = useIncidents();
  const { getLocationString } = useGeolocation();

  // ─── State ──────────────────────────────────────────────────────
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All Types");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [selectedIncident, setSelectedIncident] = useState<any>(null);

  // ─── Filter Incidents ──────────────────────────────────────────
  const filteredIncidents = incidents.filter((inc) => {
    const matchesSearch =
      inc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "All Types" || inc.type === filterType;
    const matchesStatus = filterStatus === "All Status" || inc.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  // ─── Pagination ────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filteredIncidents.length / ITEMS_PER_PAGE));
  const paginatedIncidents = filteredIncidents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // ─── Submit Incident ──────────────────────────────────────────
  const handleSubmit = useCallback(() => {
    if (!type) {
      setError("Please select an incident type");
      return;
    }
    if (!description) {
      setError("Please enter a description");
      return;
    }

    const newIncident = {
      id: Date.now(),
      type,
      description,
      location: getLocationString(),
      time: new Date().toLocaleString(),
      status: "Reported" as const,
    };

    const saved = localStorage.getItem("incidents");
    const incidents = saved ? JSON.parse(saved) : [];
    localStorage.setItem("incidents", JSON.stringify([newIncident, ...incidents]));
    window.dispatchEvent(new Event("incidentUpdated"));
    window.dispatchEvent(new Event("storage"));

    setSuccess(true);
    setType("");
    setDescription("");
    setError("");
    loadIncidents();

    setTimeout(() => setSuccess(false), 3000);
  }, [type, description, getLocationString, loadIncidents]);

  // ─── Update Incident Status ──────────────────────────────────
  const handleUpdateStatus = useCallback((id: number, newStatus: "Reported" | "In Progress" | "Resolved") => {
    const updated = incidents.map((inc) =>
      inc.id === id ? { ...inc, status: newStatus } : inc
    );
    localStorage.setItem("incidents", JSON.stringify(updated));
    window.dispatchEvent(new Event("incidentUpdated"));
    window.dispatchEvent(new Event("storage"));
    loadIncidents();
  }, [incidents, loadIncidents]);

  // ─── Clear Filters ────────────────────────────────────────────
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFilterType("All Types");
    setFilterStatus("All Status");
    setCurrentPage(1);
  }, []);

  // ─── Load incidents on mount ─────────────────────────────────
  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2 sm:gap-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <span className="text-3xl">🚨</span>
              Incident Reporting
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
              Report incidents and track their status
            </p>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-3 p-4 mb-6 font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <span>✅</span>
            Incident reported successfully
          </div>
        )}

        {/* Form */}
        <IncidentForm
          type={type}
          setType={setType}
          description={description}
          setDescription={setDescription}
          location={getLocationString()}
          onSubmit={handleSubmit}
          error={error}
          types={[...INCIDENT_TYPES]}
        />

        {/* Stats */}
        <IncidentStats incidents={incidents} />

        {/* Filters */}
        {incidents.length > 0 && (
          <IncidentFilters
            search={searchTerm}
            onSearchChange={setSearchTerm}
            filterType={filterType}
            onFilterTypeChange={setFilterType}
            filterStatus={filterStatus}
            onFilterStatusChange={setFilterStatus}
            types={TYPE_OPTIONS}
            statuses={STATUS_OPTIONS}
            onClear={clearFilters}
            totalCount={filteredIncidents.length}
          />
        )}

        {/* List */}
        <IncidentList
          incidents={paginatedIncidents}
          onView={setSelectedIncident}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          totalItems={filteredIncidents.length}
        />
      </div>

      {/* Detail Modal */}
      <IncidentModal
        incident={selectedIncident}
        onClose={() => setSelectedIncident(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};

export default IncidentPage;