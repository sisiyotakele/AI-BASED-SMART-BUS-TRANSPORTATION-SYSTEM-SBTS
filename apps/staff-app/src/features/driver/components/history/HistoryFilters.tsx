// src/features/driver/components/history/HistoryFilters.tsx

import React from 'react';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';
import { MdDateRange } from 'react-icons/md';

interface HistoryFiltersProps {
  activeTab: string;
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  route: string;
  onRouteChange: (value: string) => void;
  type: string;
  onTypeChange: (value: string) => void;
  priority: string;
  onPriorityChange: (value: string) => void;
  condition: string;
  onConditionChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  routes: string[];
  incidentTypes: string[];
  priorities: string[];
  conditions: string[];
  onClear: () => void;
  totalCount: number;
  searchPlaceholder?: string;
  statusOptions?: string[];
}

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  activeTab,
  search,
  onSearchChange,
  status,
  onStatusChange,
  route,
  onRouteChange,
  type,
  onTypeChange,
  priority,
  onPriorityChange,
  condition,
  onConditionChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  routes,
  incidentTypes,
  priorities,
  conditions,
  onClear,
  totalCount,
  searchPlaceholder = "Search...",
  statusOptions = ["All Status"],
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <FaFilter className="text-gray-400 dark:text-gray-500" />

        {/* Status Filter - All tabs */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#12B2E4]"
        >
          {statusOptions.map((opt) => (
            <option key={opt}>{opt}</option>
          ))}
        </select>

        {/* Route Filter - Only for Trips tab */}
        {activeTab === "trips" && (
          <select
            value={route}
            onChange={(e) => onRouteChange(e.target.value)}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#12B2E4]"
          >
            <option>All Routes</option>
            {routes.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        )}

        {/* Type Filter - Only for Incidents tab */}
        {activeTab === "incidents" && incidentTypes.length > 0 && (
          <select
            value={type}
            onChange={(e) => onTypeChange(e.target.value)}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#12B2E4]"
          >
            <option>All Types</option>
            {incidentTypes.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        )}

        {/* Priority Filter - Only for Maintenance tab */}
        {activeTab === "maintenance" && priorities.length > 0 && (
          <select
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#12B2E4]"
          >
            <option>All Priorities</option>
            {priorities.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        )}

        {/* Condition Filter - Only for Handovers tab */}
        {activeTab === "handovers" && conditions.length > 0 && (
          <select
            value={condition}
            onChange={(e) => onConditionChange(e.target.value)}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#12B2E4]"
          >
            <option>All Conditions</option>
            {conditions.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        )}

        {/* Date Range - All tabs */}
        <div className="flex items-center gap-2">
          <MdDateRange className="text-gray-400 dark:text-gray-500" />
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#12B2E4]"
          />
          <span className="text-xs sm:text-sm text-gray-400 dark:text-gray-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#12B2E4]"
          />
        </div>

        {/* Search - All tabs */}
        <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600 min-w-[150px] sm:min-w-[200px]">
          <FaSearch className="text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent outline-none text-xs sm:text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
          />
          {search && (
            <button onClick={() => onSearchChange('')} className="text-gray-400 hover:text-gray-600">
              <FaTimes size={12} />
            </button>
          )}
        </div>

        {/* Clear Button */}
        <button
          onClick={onClear}
          className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors flex items-center gap-1.5"
        >
          <FaTimes size={11} />
          Clear
        </button>
      </div>

      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3">
        Showing {totalCount} item{totalCount !== 1 ? 's' : ''}
        {search && ` matching "${search}"`}
      </div>
    </div>
  );
};