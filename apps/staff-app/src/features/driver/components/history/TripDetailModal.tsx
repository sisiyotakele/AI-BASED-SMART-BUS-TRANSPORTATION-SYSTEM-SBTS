// src/features/driver/components/history/TripDetailModal.tsx

import React, { useState } from 'react';
import { FaTimes, FaCheck, FaUsers, FaClock, FaTachometerAlt, FaStar, FaGasPump, FaRoute, FaBus, FaMapMarkerAlt, FaCalendarAlt, FaInfoCircle } from 'react-icons/fa';
import { MdTimeline, MdDirectionsBus } from 'react-icons/md';
import Button from '../Button';
import { Trip } from '../../types';

interface TripDetailModalProps {
  trip: Trip | null;
  onClose: () => void;
}

// Updated TIMELINE_DOT to match API status values
const TIMELINE_DOT: Record<string, string> = {
  completed: "bg-green-500",
  in_progress: "bg-blue-500",
  scheduled: "bg-yellow-500",
  cancelled: "bg-red-500",
  delayed: "bg-orange-500",
  // Fallback
  default: "bg-gray-500",
};

// Updated STATUS_CONFIG to match API status values
const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  completed: { 
    color: "text-green-600 dark:text-green-400", 
    bg: "bg-green-50 dark:bg-green-900/30", 
    label: "Completed" 
  },
  in_progress: { 
    color: "text-blue-600 dark:text-blue-400", 
    bg: "bg-blue-50 dark:bg-blue-900/30", 
    label: "In Progress" 
  },
  scheduled: { 
    color: "text-yellow-600 dark:text-yellow-400", 
    bg: "bg-yellow-50 dark:bg-yellow-900/30", 
    label: "Scheduled" 
  },
  cancelled: { 
    color: "text-red-600 dark:text-red-400", 
    bg: "bg-red-50 dark:bg-red-900/30", 
    label: "Cancelled" 
  },
  delayed: { 
    color: "text-orange-600 dark:text-orange-400", 
    bg: "bg-orange-50 dark:bg-orange-900/30", 
    label: "Delayed" 
  },
  // Fallback for any other status
  default: { 
    color: "text-gray-600 dark:text-gray-400", 
    bg: "bg-gray-50 dark:bg-gray-700/50", 
    label: "Unknown" 
  },
};

export const TripDetailModal: React.FC<TripDetailModalProps> = ({ trip, onClose }) => {
  const [activeTab, setActiveTab] = useState<"timeline" | "stops" | "details">("timeline");

  if (!trip) return null;

  // Helper to get status config with fallback
  const getStatusConfig = (status: string) => {
    const config = STATUS_CONFIG[status?.toLowerCase() || ''];
    return config || STATUS_CONFIG.default;
  };

  // Helper to get timeline dot color
  const getDotColor = (status: string) => {
    return TIMELINE_DOT[status?.toLowerCase() || ''] || TIMELINE_DOT.default;
  };

  const statusConfig = getStatusConfig(trip.status);
  const dotColor = getDotColor(trip.status);

  // Timeline items based on trip data
  const timelineItems = [
    { 
      time: (trip as any).scheduledStart || trip.scheduledDeparture || 'N/A', 
      title: "Scheduled Departure", 
      subtitle: trip.startStop ? `From ${trip.startStop}` : 'From Start' 
    },
    { 
      time: (trip as any).actualStart || trip.actualDeparture || 'N/A', 
      title: "Actual Departure", 
      subtitle: trip.startStop ? `From ${trip.startStop}` : 'From Start' 
    },
    { 
      time: (trip as any).scheduledEnd || trip.scheduledArrival || 'N/A', 
      title: "Scheduled Arrival", 
      subtitle: trip.endStop ? `At ${trip.endStop}` : 'At Destination' 
    },
    { 
      time: (trip as any).actualEnd || trip.actualArrival || 'N/A', 
      title: "Actual Arrival", 
      subtitle: trip.endStop ? `At ${trip.endStop}` : 'At Destination' 
    },
  ];

  const statCards = [
    { icon: <FaRoute size={11} />, value: trip.distance || 'N/A', label: "Distance" },
    { icon: <FaClock size={11} />, value: trip.duration || 'N/A', label: "Duration" },
    { icon: <FaStar size={11} />, value: trip.rating ? String(trip.rating) : "—", label: "Rating" },
    { icon: <FaTachometerAlt size={11} />, value: trip.traffic || "Normal", label: "Traffic" },
  ];

  const tabs: { key: "timeline" | "stops" | "details"; label: string; icon: React.ReactNode }[] = [
    { key: "timeline", label: "Timeline", icon: <MdTimeline size={13} /> },
    { key: "stops", label: "Stops", icon: <FaMapMarkerAlt size={11} /> },
    { key: "details", label: "Details", icon: <FaInfoCircle size={11} /> },
  ];

  // Helper to format date/time
  const formatDateTime = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-bold text-[#12B2E4]">
              <FaBus size={11} /> {trip.tripId || trip.id?.slice(0, 8) || 'N/A'}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                {trip.route || 'Unknown Route'}
              </h2>
              {trip.routeCode && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold text-white bg-[#12B2E4] rounded">
                  {trip.routeCode}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <FaCalendarAlt size={10} /> {trip.date || 'N/A'}
              </span>
              <span className="flex items-center gap-1">
                <FaClock size={10} /> {trip.time || 'N/A'}
              </span>
              <span className="flex items-center gap-1">
                <FaBus size={10} /> {trip.bus || 'N/A'}
              </span>
              <span className="flex items-center gap-1">
                <FaMapMarkerAlt size={10} /> {trip.stops || 0} stops
              </span>
              <span className="flex items-center gap-1">
                <MdDirectionsBus size={10} /> {trip.distance || '0 km'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
              {statusConfig.label}
            </span>
            <Button text="Close" variant="outline" size="sm" icon={<FaTimes size={11} />} onClick={onClose} />
          </div>
        </div>

        <hr className="my-4 border-gray-100 dark:border-gray-700" />

        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statCards.map((s) => (
            <div key={s.label} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-gray-800 dark:text-white">{s.value}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center justify-center gap-1 mt-0.5">
                {s.icon} {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-5 mt-6 border-b border-gray-100 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-2 text-sm font-medium flex items-center gap-1.5 border-b-2 -mb-px transition-colors ${
                activeTab === tab.key
                  ? "text-[#12B2E4] border-[#12B2E4]"
                  : "text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {activeTab === "timeline" && (
            <div>
              {timelineItems.map((item, i) => {
                // Only show items that have valid data
                if (item.time === 'N/A' && i === 0) {
                  // Always show the first item even if N/A
                }
                // Check if we should show this item (only show actual arrival if it exists)
                if (i === 3 && !(trip as any).actualEnd && !trip.actualArrival) {
                  return null;
                }
                
                return (
                  <div key={item.title} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-6 h-6 rounded-full ${dotColor} text-white flex items-center justify-center flex-shrink-0`}>
                        <FaCheck size={9} />
                      </div>
                      {i < timelineItems.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200 dark:bg-gray-600" style={{ minHeight: "28px" }} />
                      )}
                    </div>
                    <div className={i < timelineItems.length - 1 ? "pb-5" : ""}>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{formatDateTime(item.time)}</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === "stops" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#12B2E4] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">1</div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {trip.startStop || 'Start'} <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">(Start)</span>
                </p>
              </div>
              
              {(trip.stops || 0) > 2 && (
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-400 flex items-center justify-center text-[10px] font-bold flex-shrink-0">···</div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(trip.stops || 0) - 2} intermediate stop{(trip.stops || 0) - 2 > 1 ? 's' : ''} along {trip.route || 'the route'}
                  </p>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-[#12B2E4] text-white flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                  {trip.stops || 1}
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {trip.endStop || 'Destination'} <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">(End)</span>
                </p>
              </div>
            </div>
          )}

          {activeTab === "details" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Route Type</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {trip.routeType || 'City'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">City</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {trip.city || 'Addis Ababa'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Distance</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {trip.distance || '0 km'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Duration</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {trip.duration || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Bus</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {trip.bus || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Status</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {statusConfig.label}
                </p>
              </div>
              {trip.passengers !== undefined && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Passengers</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {trip.passengers}
                  </p>
                </div>
              )}
              {trip.fuelUsed && (
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Fuel Used</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {trip.fuelUsed}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        {trip.notes && (
          <div className="mt-5 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex items-start gap-2">
            <span className="text-sm">💬</span>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-medium text-gray-700 dark:text-gray-400">Notes: </span>
              {trip.notes}
            </p>
          </div>
        )}

        {/* Passengers and Fuel (if available) */}
        {(trip.passengers !== undefined || trip.fuelUsed) && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-4">
              {trip.passengers !== undefined && (
                <div className="flex items-center gap-2">
                  <FaUsers className="text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Passengers:</span> {trip.passengers}
                  </span>
                </div>
              )}
              {trip.fuelUsed && (
                <div className="flex items-center gap-2">
                  <FaGasPump className="text-gray-400 dark:text-gray-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    <span className="font-medium">Fuel Used:</span> {trip.fuelUsed}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};