// src/features/driver/pages/NotificationPage.tsx

import React, { useState } from 'react';
import {
  NotificationHeader,
  NotificationFilters,
  NotificationList,
} from '../components/notification';
import { useNotifications } from '../hooks/useNotifications';

type FilterType = "all" | "unread" | "alerts" | "updates";

const NotificationPage: React.FC = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");

  // ─── Get Settings from localStorage ────────────────────────────
  const savedSettings = localStorage.getItem("driverSettings");
  const settings = savedSettings ? JSON.parse(savedSettings) : null;

  // ─── Filter Notifications Based on Settings ────────────────────
  const settingsFiltered = settings
    ? notifications.filter((n) => {
        if (n.type === "Route Updates") return settings.notifications?.trip;
        if (n.type === "Traffic Alerts") return settings.notifications?.traffic;
        if (n.type === "Emergency Messages") return settings.notifications?.emergency;
        if (n.type === "Dispatch Communications") return settings.notifications?.incident;
        return true;
      })
    : notifications;

  // ─── Apply Category Filter ─────────────────────────────────────
  const filteredNotifications = settingsFiltered.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return !n.read;
    if (activeFilter === "alerts") return n.type === "Traffic Alerts" || n.type === "Emergency Messages";
    if (activeFilter === "updates") return n.type === "Route Updates" || n.type === "Dispatch Communications";
    return true;
  });

  // ─── Counts for Filters ────────────────────────────────────────
  const unreadCount = notifications.filter((n) => !n.read).length;
  const counts = {
    all: settingsFiltered.length,
    unread: settingsFiltered.filter((n) => !n.read).length,
    alerts: settingsFiltered.filter((n) => n.type === "Traffic Alerts" || n.type === "Emergency Messages").length,
    updates: settingsFiltered.filter((n) => n.type === "Route Updates" || n.type === "Dispatch Communications").length,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 sm:p-6">
          
          <NotificationHeader
            unreadCount={unreadCount}
            onMarkAllRead={markAllAsRead}
          />

          <NotificationFilters
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            counts={counts}
          />

          <NotificationList
            notifications={filteredNotifications}
            onMarkAsRead={markAsRead}
          />

        </div>
      </div>
    </div>
  );
};

export default NotificationPage;