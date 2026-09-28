// src/features/driver/pages/IncidentPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  IncidentForm,
  IncidentList,
  IncidentFilters,
  IncidentStats,
} from '../components/incident';
import { IncidentModal } from '../components/modals';
import { incidentsApi } from '../services/api/incidents';
import { tripsApi } from '../services/api/trips';
import { useGeolocation } from '../hooks';

export interface Incident {
  id: number;
  type: string;
  description: string;
  location: string;
  time: string;
  status: "Reported" | "In Progress" | "Resolved";
  createdAt?: string;
  updatedAt?: string;
  severity?: string;
  latitude?: number;
  longitude?: number;
}

const DEFAULT_INCIDENT_TYPES = [
  "Accident",
  "Vehicle breakdown",
  "Engine problem",
  "Brake failure",
  "Tire puncture",
  "Electrical issue",
  "Passenger medical emergency",
  "Passenger dispute",
  "Unruly passenger",
  "Traffic congestion",
  "Road obstruction",
  "Road closure",
  "Flood",
  "Heavy rain",
  "Poor visibility",
  "Late departure",
  "Schedule delay",
  "Other",
];

const ITEMS_PER_PAGE = 9;
const STATUS_OPTIONS = ["All Status", "Reported", "In Progress", "Resolved"];

const IncidentPage: React.FC = () => {
  const { getLocationString, getCurrentPosition } = useGeolocation();

  // ─── State ──────────────────────────────────────────────────────
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [incidentTypes] = useState<string[]>(DEFAULT_INCIDENT_TYPES);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState(false);
  const [locationStr, setLocationStr] = useState("Waiting for GPS...");

  // Trip data for incident creation
  const [driverId, setDriverId] = useState<string | null>(null);
  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [busId, setBusId] = useState<string | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All Types");
  const [filterStatus, setFilterStatus] = useState("All Status");
  const [currentPage, setCurrentPage] = useState(1);

  // Modal state
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // ─── Get Driver ID from localStorage ──────────────────────────
  useEffect(() => {
    const id = localStorage.getItem('driverId');
    if (id) {
      setDriverId(id);
      console.log('📌 Driver ID loaded:', id);
    } else {
      console.warn('⚠️ No driver ID found in localStorage');
    }
  }, []);

  // ─── Get Active Trip ──────────────────────────────────────────
  const loadActiveTrip = useCallback(async () => {
    if (!driverId) return;

    try {
      console.log('🔄 Loading active trip for driver:', driverId);
      const trip = await tripsApi.getCurrentTrip();
      if (trip) {
        setActiveTrip(trip);
        setBusId(trip.bus_id || trip.bus || null);
        console.log('🚌 Active trip loaded:', trip);
        console.log('🚍 Bus ID:', trip.bus_id || trip.bus);
      } else {
        console.log('ℹ️ No active trip found');
        setActiveTrip(null);
        setBusId(null);
      }
    } catch (err) {
      console.warn('⚠️ Could not load active trip:', err);
      setActiveTrip(null);
      setBusId(null);
    }
  }, [driverId]);

  useEffect(() => {
    if (driverId) {
      loadActiveTrip();
    }
  }, [driverId, loadActiveTrip]);

  // ─── Get Location ──────────────────────────────────────────────
  const updateLocation = useCallback(async () => {
    try {
      const pos = await getCurrentPosition();
      if (pos) {
        setLocationStr(`${pos.latitude.toFixed(6)}, ${pos.longitude.toFixed(6)}`);
      }
    } catch (err) {
      console.warn('Could not get location:', err);
      setLocationStr('Location unavailable');
    }
  }, [getCurrentPosition]);

  useEffect(() => {
    updateLocation();
  }, [updateLocation]);

  // ─── Load Incidents ─────────────────────────────────────────────
  const loadIncidents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Loading incidents...');
      const result = await incidentsApi.getMyIncidents();
      console.log('📊 Incidents loaded:', result);

      const mappedIncidents: Incident[] = (result.incidents || []).map((n: any) => ({
        id: n.id || Date.now(),
        type: n.incident_type || n.type || 'Other',
        description: n.description || '',
        location: n.location || 'Unknown',
        time: n.time || n.createdAt || new Date().toISOString(),
        status: n.status || 'Reported',
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
        severity: n.severity || 'medium',
        latitude: n.latitude,
        longitude: n.longitude,
      }));

      setIncidents(mappedIncidents);
    } catch (err: any) {
      console.error('❌ Error loading incidents:', err);
      setError(err.message || 'Failed to load incidents');
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

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
  const handleSubmit = useCallback(async () => {
    if (!type) {
      setFormError("Please select an incident type");
      return;
    }
    if (!description) {
      setFormError("Please enter a description");
      return;
    }

    // Validate required IDs
    if (!driverId) {
      setFormError("Driver ID not found. Please login again.");
      return;
    }

    if (!activeTrip) {
      setFormError("No active trip found. Please start a trip first.");
      return;
    }

    if (!busId) {
      setFormError("Bus ID not found. Please start a trip first.");
      return;
    }

    setFormError("");
    setSubmitting(true);

    try {
      // Get current position for coordinates
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

      // Map severity based on incident type
      let severity = 'medium';
      const highSeverityTypes = ['Accident', 'Vehicle breakdown', 'Engine problem', 'Brake failure', 'Passenger medical emergency', 'Flood'];
      const mediumSeverityTypes = ['Tire puncture', 'Electrical issue', 'Unruly passenger', 'Traffic congestion', 'Road obstruction', 'Road closure', 'Heavy rain'];

      if (highSeverityTypes.includes(type)) {
        severity = 'high';
      } else if (mediumSeverityTypes.includes(type)) {
        severity = 'medium';
      } else {
        severity = 'low';
      }

      // Prepare payload matching backend schema
      const payload = {
        tripId: activeTrip.id?.toString() || '',
        incidentType: type,
        description: description,
        severity: severity,
        latitude: latitude,
        longitude: longitude,
      };

      console.log('📤 Sending incident payload:', payload);

      const result = await incidentsApi.create(payload);
      console.log('✅ Incident created:', result);

      setSuccess(true);
      setType("");
      setDescription("");
      setFormError("");

      // Reload incidents
      await loadIncidents();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('❌ Error submitting incident:', err);

      // Handle different error types
      if (err.response?.data?.message) {
        setFormError(err.response.data.message);
      } else if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorMessages = Object.values(errors).flat().join(', ');
        setFormError(errorMessages);
      } else if (err.response?.data?.error) {
        setFormError(err.response.data.error);
      } else {
        setFormError(err.message || 'Failed to submit incident. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  }, [type, description, driverId, activeTrip, busId, getCurrentPosition, loadIncidents]);

  // ─── View Incident ─────────────────────────────────────────────
  const handleViewIncident = useCallback((incident: Incident) => {
    console.log('👁️ Viewing incident:', incident);
    setSelectedIncident(incident);
    setIsModalOpen(true);
  }, []);

  // ─── Close Modal ──────────────────────────────────────────────
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedIncident(null);
  }, []);

  // ─── Update Incident Status ──────────────────────────────────
  const handleUpdateStatus = useCallback(async (id: number, newStatus: "Reported" | "In Progress" | "Resolved") => {
    setUpdatingStatus(true);
    try {
      await incidentsApi.updateStatus(id, newStatus);

      setIncidents((prev) =>
        prev.map((inc) =>
          inc.id === id ? { ...inc, status: newStatus } : inc
        )
      );

      if (selectedIncident && selectedIncident.id === id) {
        setSelectedIncident({ ...selectedIncident, status: newStatus });
      }
      console.log('✅ Status updated successfully');
    } catch (err) {
      console.error('Failed to update incident status:', err);
      setError('Failed to update incident status');
    } finally {
      setUpdatingStatus(false);
    }
  }, [selectedIncident]);

  // ─── Clear Filters ────────────────────────────────────────────
  const clearFilters = useCallback(() => {
    setSearchTerm("");
    setFilterType("All Types");
    setFilterStatus("All Status");
    setCurrentPage(1);
  }, []);

  // ─── Loading State ─────────────────────────────────────────────
  if (loading && incidents.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#12B2E4] border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading incidents...</p>
        </div>
      </div>
    );
  }

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
          <button
            onClick={loadIncidents}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow transition-all disabled:opacity-50"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 font-semibold text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl animate-in fade-in duration-300">
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

        {/* Success Message */}
        {success && (
          <div className="flex items-center gap-3 p-4 mb-6 font-semibold text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
            <span>✅</span>
            Incident reported successfully
          </div>
        )}

        {/* Warning: No active trip */}
        {driverId && !activeTrip && !loading && (
          <div className="flex items-center gap-3 p-4 mb-6 font-semibold text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl">
            <span>⚠️</span>
            No active trip found. Please start a trip before reporting an incident.
          </div>
        )}

        {/* Form */}
        <IncidentForm
          type={type}
          setType={setType}
          description={description}
          setDescription={setDescription}
          location={locationStr}
          onSubmit={handleSubmit}
          error={formError}
          types={incidentTypes}
          loading={submitting}
          disabled={!activeTrip || !driverId}
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
            types={["All Types", ...incidentTypes]}
            statuses={STATUS_OPTIONS}
            onClear={clearFilters}
            totalCount={filteredIncidents.length}
          />
        )}

        {/* List */}
        <IncidentList
          incidents={paginatedIncidents}
          onView={handleViewIncident}
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
          totalItems={filteredIncidents.length}
        />
      </div>

      {/* Modal */}
      <IncidentModal
        isOpen={isModalOpen}
        incident={selectedIncident}
        onClose={handleCloseModal}
        onUpdateStatus={handleUpdateStatus}
        loading={updatingStatus}
      />
    </div>
  );
};

export default IncidentPage;