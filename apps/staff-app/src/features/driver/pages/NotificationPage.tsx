// src/features/driver/pages/NotificationPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  NotificationHeader,
  NotificationFilters,
  NotificationList,
} from '../components/notification';
import { notificationsApi } from '../services/api/notifications';

export interface Notification {
  id: number;
  type: string;
  message: string;
  time: string;
  read: boolean;
  createdAt?: string;
  updatedAt?: string;
}

type FilterType = "all" | "unread" | "alerts" | "updates";

const NotificationPage: React.FC = () => {
  // ─── State ──────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [unreadCount, setUnreadCount] = useState(0);
  const [settings, setSettings] = useState<any>(null);

  // ─── Load Settings from localStorage ──────────────────────────
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('notificationSettings');
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (err) {
      console.warn('Failed to load notification settings:', err);
    }
  }, []);

  // ─── Load Notifications ────────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await notificationsApi.getAll();
      
      // Map API response to Notification format
      const mappedNotifications: Notification[] = (result.notifications || []).map((n: any) => ({
        id: n.id,
        type: n.type || 'General',
        message: n.message || n.content || '',
        time: n.time || n.createdAt || new Date().toISOString(),
        read: n.read || false,
        createdAt: n.createdAt,
        updatedAt: n.updatedAt,
      }));

      setNotifications(mappedNotifications);
      
      // Get unread count
      const unread = mappedNotifications.filter((n) => !n.read).length;
      setUnreadCount(unread);

    } catch (err: any) {
      console.error('❌ Error loading notifications:', err);
      setError(err.message || 'Failed to load notifications');
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // ─── Filter Notifications Based on Settings ────────────────────
  const settingsFiltered = settings
    ? notifications.filter((n) => {
        if (n.type === "Route Updates") return settings.trip !== false;
        if (n.type === "Traffic Alerts") return settings.traffic !== false;
        if (n.type === "Emergency Messages") return settings.emergency !== false;
        if (n.type === "Dispatch Communications") return settings.incident !== false;
        return true;
      })
    : notifications;

  // ─── Apply Category Filter ─────────────────────────────────────
  const filteredNotifications = settingsFiltered.filter((n) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "unread") return !n.read;
    if (activeFilter === "alerts") {
      return n.type === "Traffic Alerts" || 
             n.type === "Emergency Messages" || 
             n.type === "Incident Alerts";
    }
    if (activeFilter === "updates") {
      return n.type === "Route Updates" || 
             n.type === "Dispatch Communications" || 
             n.type === "Trip Updates";
    }
    return true;
  });

  // ─── Counts for Filters ────────────────────────────────────────
  const counts = {
    all: settingsFiltered.length,
    unread: settingsFiltered.filter((n) => !n.read).length,
    alerts: settingsFiltered.filter((n) => 
      n.type === "Traffic Alerts" || 
      n.type === "Emergency Messages" || 
      n.type === "Incident Alerts"
    ).length,
    updates: settingsFiltered.filter((n) => 
      n.type === "Route Updates" || 
      n.type === "Dispatch Communications" || 
      n.type === "Trip Updates"
    ).length,
  };

  // ─── Handlers ──────────────────────────────────────────────────
  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, read: true } : n
        )
      );
      
      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      setError('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      setError('Failed to mark all notifications as read');
    }
  };

  // ─── Loading State ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#12B2E4] border-t-transparent"></div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Loading notifications...</p>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F4F7FB] dark:bg-[#0B1120] pt-6 sm:pt-10 pb-12 sm:pb-16 px-4 sm:px-6 lg:px-8 xl:px-12 selection:bg-[#12B2E4]/30">
      <div className="max-w-[70rem] mx-auto w-full">
        {/* Page Title */}
        <div className="mb-6 lg:mb-8 pl-2 w-full flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold mb-1 tracking-[0.2em] text-gray-400 dark:text-gray-500 uppercase flex items-center gap-2">
              <span className="w-5 h-px bg-gray-300 dark:bg-gray-700"></span>
              Updates & Alerts
            </p>
            <h1 className="text-3xl lg:text-4xl font-black text-gray-900 dark:text-white tracking-tight">Notifications Center</h1>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111827] rounded-[2.5rem] p-8 lg:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border-0 w-full relative overflow-hidden">
          
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-4 p-4 mb-8 font-bold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/50 rounded-2xl shadow-sm">
              <span className="bg-rose-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">!</span>
              <span className="flex-1">{error}</span>
              <button
                onClick={() => setError(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-700 dark:text-rose-400 transition-colors"
                title="Dismiss"
              >
                ×
              </button>
            </div>
          )}

          <div className="flex flex-col gap-8">
            <NotificationHeader
              unreadCount={unreadCount}
              onMarkAllRead={handleMarkAllAsRead}
            />

            <div className="w-full h-px bg-gray-100 dark:bg-gray-800/60" />

            <NotificationFilters
              activeFilter={activeFilter}
              onFilterChange={setActiveFilter}
              counts={counts}
            />

            <div className="mt-4">
              <NotificationList
                notifications={filteredNotifications}
                onMarkAsRead={handleMarkAsRead}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPage;