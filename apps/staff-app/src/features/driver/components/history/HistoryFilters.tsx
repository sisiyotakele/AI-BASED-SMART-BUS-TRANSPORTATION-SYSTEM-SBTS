// src/features/driver/components/history/HistoryFilters.tsx

import React from 'react';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';
import { MdDateRange } from 'react-icons/md';
import Button from '../Button';

interface HistoryFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  route: string;
  onRouteChange: (value: string) => void;
  startDate: string;
  onStartDateChange: (value: string) => void;
  endDate: string;
  onEndDateChange: (value: string) => void;
  routes: string[];
  onClear: () => void;
  totalCount: number;
  searchPlaceholder?: string;
  showRouteFilter?: boolean;
  statusOptions?: string[];
}

export const HistoryFilters: React.FC<HistoryFiltersProps> = ({
  search,
  onSearchChange,
  status,
  onStatusChange,
  route,
  onRouteChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  routes,
  onClear,
  totalCount,
  searchPlaceholder = "Search trips, routes, buses...",
  showRouteFilter = true,
  statusOptions = ["All Status", "Completed", "Delayed", "Cancelled", "In-progress"],
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400 dark:text-gray-500" />
          <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#12B2E4]"
          >
            {statusOptions.map((opt) => (
              <option key={opt}>{opt}</option>
            ))}
          </select>
        </div>

        {showRouteFilter && (
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">Route:</span>
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
          </div>
        )}

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

        <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600 min-w-[150px] sm:min-w-[200px]">
          <FaSearch className="text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent outline-none text-xs sm:text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        <Button text="Clear" variant="ghost" size="sm" icon={<FaTimes size={11} />} onClick={onClear} />
      </div>

      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3">
        Showing {totalCount} item{totalCount !== 1 ? 's' : ''}
        {search && ` matching "${search}"`}
      </div>
    </div>
  );
};