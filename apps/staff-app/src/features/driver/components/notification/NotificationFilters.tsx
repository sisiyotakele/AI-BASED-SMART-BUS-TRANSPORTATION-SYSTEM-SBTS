// src/features/driver/components/notification/NotificationFilters.tsx

import React from 'react';
import { FaBell, FaFilter, FaExclamationTriangle, FaRoute, FaCheckCircle } from 'react-icons/fa';

interface NotificationFiltersProps {
  activeFilter: "all" | "unread" | "alerts" | "updates";
  onFilterChange: (filter: "all" | "unread" | "alerts" | "updates") => void;
  counts: {
    all: number;
    unread: number;
    alerts: number;
    updates: number;
  };
}

export const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  activeFilter,
  onFilterChange,
  counts,
}) => {
  const filters = [
    { id: "all" as const, label: "All", icon: <FaBell className="text-xs" /> },
    { id: "unread" as const, label: "Unread", icon: <FaCheckCircle className="text-xs" /> },
    { id: "alerts" as const, label: "Alerts", icon: <FaExclamationTriangle className="text-xs" /> },
    { id: "updates" as const, label: "Updates", icon: <FaRoute className="text-xs" /> },
  ];

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 pb-4 mb-1 border-b border-gray-100 dark:border-gray-700">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-colors touch-manipulation ${
            activeFilter === filter.id
              ? "bg-[#12B2E4] text-white font-medium"
              : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600"
          }`}
        >
          {filter.icon}
          {filter.label}
          <span className={`text-[10px] ${
            activeFilter === filter.id
              ? "text-white/80"
              : "text-gray-400 dark:text-gray-500"
          }`}>
            ({counts[filter.id]})
          </span>
        </button>
      ))}
    </div>
  );
};