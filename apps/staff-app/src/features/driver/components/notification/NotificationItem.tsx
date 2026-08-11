// src/features/driver/components/notification/NotificationItem.tsx

import React from 'react';
import { FaRoute, FaExclamationTriangle, FaBullhorn, FaBell } from 'react-icons/fa';
import { Notification } from '../../hooks/useNotifications';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case "Route Updates":
      return <FaRoute className="text-[#12B2E4]" />;
    case "Traffic Alerts":
      return <FaExclamationTriangle className="text-amber-500 dark:text-amber-400" />;
    case "Emergency Messages":
      return <FaExclamationTriangle className="text-rose-500 dark:text-rose-400" />;
    case "Dispatch Communications":
      return <FaBullhorn className="text-purple-500 dark:text-purple-400" />;
    default:
      return <FaBell className="text-gray-500 dark:text-gray-400" />;
  }
};

const getIconBg = (type: string) => {
  switch (type) {
    case "Route Updates":
      return "bg-blue-50 dark:bg-blue-900/30";
    case "Traffic Alerts":
      return "bg-amber-50 dark:bg-amber-900/30";
    case "Emergency Messages":
      return "bg-rose-50 dark:bg-rose-900/30";
    case "Dispatch Communications":
      return "bg-purple-50 dark:bg-purple-900/30";
    default:
      return "bg-gray-50 dark:bg-gray-700";
  }
};

const getTypeLabel = (type: string) => {
  switch (type) {
    case "Route Updates": return "Route updates";
    case "Traffic Alerts": return "Traffic alerts";
    case "Emergency Messages": return "Emergency messages";
    case "Dispatch Communications": return "Dispatch communications";
    default: return "General";
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
}) => {
  return (
    <div
      onClick={() => onMarkAsRead(notification.id)}
      className={`flex gap-3 py-3 sm:py-4 px-2 sm:px-3 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
        notification.read ? "opacity-75" : ""
      } border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
        notification.read ? "border-l-2 border-l-transparent" : "border-l-2 border-l-[#12B2E4]"
      }`}
    >
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBg(notification.type)} text-sm sm:text-base`}>
        {getIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">
          {getTypeLabel(notification.type)}
        </div>
        <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 mt-0.5">
          {notification.message}
        </p>
        <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5 block">
          {notification.time}
        </span>
      </div>
    </div>
  );
};