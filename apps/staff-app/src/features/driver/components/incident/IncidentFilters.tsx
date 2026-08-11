// src/features/driver/components/incident/IncidentFilters.tsx

import React from 'react';
import { FaSearch, FaFilter, FaTimes } from 'react-icons/fa';
import Button from '../Button';

interface IncidentFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterType: string;
  onFilterTypeChange: (value: string) => void;
  filterStatus: string;
  onFilterStatusChange: (value: string) => void;
  types: string[];
  statuses: string[];
  onClear: () => void;
  totalCount: number;
}

export const IncidentFilters: React.FC<IncidentFiltersProps> = ({
  search,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  filterStatus,
  onFilterStatusChange,
  types,
  statuses,
  onClear,
  totalCount,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex-1 flex items-center gap-2 bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600 min-w-[150px] sm:min-w-[200px]">
          <FaSearch className="text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search incidents..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="flex-1 bg-transparent outline-none text-xs sm:text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <FaFilter className="text-gray-400 dark:text-gray-500" />
          <select
            value={filterType}
            onChange={(e) => onFilterTypeChange(e.target.value)}
            className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#12B2E4]"
          >
            {types.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => onFilterStatusChange(e.target.value)}
          className="px-2 sm:px-3 py-1 text-xs sm:text-sm border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#12B2E4]"
        >
          {statuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>

        <Button text="Clear" variant="ghost" size="sm" icon={<FaTimes size={11} />} onClick={onClear} />
      </div>

      <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-3">
        Showing {totalCount} incident{totalCount !== 1 ? 's' : ''}
        {search && ` matching "${search}"`}
      </div>
    </div>
  );
};