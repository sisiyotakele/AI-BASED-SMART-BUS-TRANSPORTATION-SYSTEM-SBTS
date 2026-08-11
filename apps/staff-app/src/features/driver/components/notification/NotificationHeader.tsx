// src/features/driver/components/notification/NotificationHeader.tsx

import React from 'react';
import { FaBell, FaCheckCircle } from 'react-icons/fa';

interface NotificationHeaderProps {
  unreadCount: number;
  onMarkAllRead: () => void;
}

export const NotificationHeader: React.FC<NotificationHeaderProps> = ({
  unreadCount,
  onMarkAllRead,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <FaBell className="text-[#12B2E4]" />
          Notifications
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {unreadCount > 0 ? `${unreadCount} unread` : "All caught up! 🎉"}
        </p>
      </div>
      <button
        onClick={onMarkAllRead}
        disabled={unreadCount === 0}
        className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap touch-manipulation"
      >
        <FaCheckCircle className="text-xs" />
        Mark all read
      </button>
    </div>
  );
};