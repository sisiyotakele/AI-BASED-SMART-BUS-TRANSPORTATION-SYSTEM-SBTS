// src/features/driver/components/notification/NotificationFilters.tsx

import React from 'react';
import { FaBell, FaFilter, FaExclamationTriangle, FaRoute } from 'react-icons/fa';

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
    { id: "all" as const, label: "All", icon: <FaBell /> },
    { id: "unread" as const, label: "Unread", icon: <FaFilter /> },
    { id: "alerts" as const, label: "Alerts", icon: <FaExclamationTriangle /> },
    { id: "updates" as const, label: "Updates", icon: <FaRoute /> },
  ];

  return (
    <div className="flex flex-wrap gap-1.5 sm:gap-2 pb-4 mb-1 border-b border-gray-100 dark:border-gray-700">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm transition-colors touch-manipulation ${
            activeFilter === filter.id
              ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
              : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
          }`}
        >
          {filter.icon}
          {filter.label}
          <span className="text-[10px] text-gray-400 dark:text-gray-500">
            {counts[filter.id]}
          </span>
        </button>
      ))}
    </div>
  );
};