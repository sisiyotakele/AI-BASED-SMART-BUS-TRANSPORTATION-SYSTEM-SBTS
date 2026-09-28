// src/features/driver/components/notification/NotificationItem.tsx

import React from 'react';
import { 
  FaRoute, 
  FaExclamationTriangle, 
  FaBullhorn, 
  FaBell,
  FaInfoCircle,
  FaCheckCircle,
  FaClock
} from 'react-icons/fa';
import { Notification } from '../../pages/NotificationPage';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: number) => void;
}

const getIcon = (type: string) => {
  switch (type) {
    case "Route Updates":
    case "Trip Updates":
      return <FaRoute className="text-[#12B2E4]" />;
    case "Traffic Alerts":
      return <FaExclamationTriangle className="text-amber-500 dark:text-amber-400" />;
    case "Emergency Messages":
    case "Incident Alerts":
      return <FaExclamationTriangle className="text-rose-500 dark:text-rose-400" />;
    case "Dispatch Communications":
      return <FaBullhorn className="text-purple-500 dark:text-purple-400" />;
    case "General":
      return <FaInfoCircle className="text-gray-500 dark:text-gray-400" />;
    default:
      return <FaBell className="text-gray-500 dark:text-gray-400" />;
  }
};

const getIconBg = (type: string) => {
  switch (type) {
    case "Route Updates":
    case "Trip Updates":
      return "bg-blue-50 dark:bg-blue-900/30";
    case "Traffic Alerts":
      return "bg-amber-50 dark:bg-amber-900/30";
    case "Emergency Messages":
    case "Incident Alerts":
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
    case "Trip Updates": return "Trip updates";
    case "Traffic Alerts": return "Traffic alerts";
    case "Emergency Messages": return "Emergency messages";
    case "Incident Alerts": return "Incident alerts";
    case "Dispatch Communications": return "Dispatch communications";
    default: return type || "General";
  }
};

const formatTime = (timeStr: string) => {
  try {
    const date = new Date(timeStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hour${Math.floor(diffMins / 60) > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  } catch {
    return timeStr;
  }
};

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
}) => {
  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`flex gap-3 py-3 sm:py-4 px-2 sm:px-3 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
        notification.read ? "opacity-75" : ""
      } border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${
        notification.read ? "border-l-2 border-l-transparent" : "border-l-2 border-l-[#12B2E4]"
      }`}
    >
      <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center flex-shrink-0 ${getIconBg(notification.type)} text-sm sm:text-base`}>
        {getIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">
            {getTypeLabel(notification.type)}
          </span>
          {!notification.read && (
            <span className="w-2 h-2 bg-[#12B2E4] rounded-full flex-shrink-0"></span>
          )}
        </div>
        <p className="text-sm sm:text-base text-gray-800 dark:text-gray-200 mt-0.5">
          {notification.message}
        </p>
        <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 mt-0.5 block flex items-center gap-1">
          <FaClock className="text-[10px]" />
          {formatTime(notification.time)}
        </span>
      </div>
      {notification.read && (
        <div className="flex-shrink-0 mt-1">
          <FaCheckCircle className="text-gray-300 dark:text-gray-600 text-xs" />
        </div>
      )}
    </div>
  );
};