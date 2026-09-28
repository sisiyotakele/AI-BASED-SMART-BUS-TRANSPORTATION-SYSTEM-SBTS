// src/features/driver/pages/NotificationsPage.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBell, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaInfoCircle, 
  FaClock, 
  FaCheck, 
  FaTrash,
  FaExclamation,
  FaBus,
  FaWrench,
  FaKey,
  FaUser,
  FaArrowLeft
} from 'react-icons/fa';
import { useDriverProfile } from '../hooks';
import { getGreeting, getInitials } from '../utils';
import { DEFAULT_DRIVER } from '../constants';
import { formatDistanceToNow } from 'date-fns';

// ─── Types ──────────────────────────────────────────────────────
export interface Notification {
  id: string;
  type: 'trip' | 'incident' | 'maintenance' | 'handover' | 'system' | 'alert' | 'update';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
  icon?: React.ReactNode;
}

// ─── API Service (to be implemented) ──────────────────────────
// This will be replaced with actual API calls
const notificationsApi = {
  getNotifications: async (): Promise<Notification[]> => {
    // TODO: Replace with actual API call
    // const response = await fetch('/api/notifications');
    // return response.json();
    return [];
  },
  markAsRead: async (id: string): Promise<void> => {
    // TODO: Replace with actual API call
    // await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
  },
  markAllAsRead: async (): Promise<void> => {
    // TODO: Replace with actual API call
    // await fetch('/api/notifications/read-all', { method: 'PUT' });
  },
  deleteNotification: async (id: string): Promise<void> => {
    // TODO: Replace with actual API call
    // await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
  },
  clearAll: async (): Promise<void> => {
    // TODO: Replace with actual API call
    // await fetch('/api/notifications/clear-all', { method: 'DELETE' });
  },
};

// ─── Icon Mapping ──────────────────────────────────────────────
const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'trip':
      return <FaBus className="text-[#12B2E4]" />;
    case 'incident':
      return <FaExclamationTriangle className="text-rose-500" />;
    case 'maintenance':
      return <FaWrench className="text-amber-500" />;
    case 'handover':
      return <FaKey className="text-purple-500" />;
    case 'system':
      return <FaInfoCircle className="text-blue-500" />;
    case 'alert':
      return <FaExclamation className="text-orange-500" />;
    case 'update':
      return <FaCheckCircle className="text-emerald-500" />;
    default:
      return <FaBell className="text-gray-400" />;
  }
};

// ─── Filter Tabs ─────────────────────────────────────────────────
const FILTER_TABS = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'alert', label: 'Alerts' },
  { id: 'update', label: 'Updates' },
];

// ─── Main Component ─────────────────────────────────────────────
const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { profile: localProfile } = useDriverProfile();
  
  // ─── State ──────────────────────────────────────────────────────
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // ─── Derived Values ──────────────────────────────────────────
  const driverName = localProfile?.name || DEFAULT_DRIVER.name;
  const driverEmail = localProfile?.email || '';
  const driverInitials = getInitials(driverName);
  const greeting = getGreeting();

  // ─── Computed Values ──────────────────────────────────────────
  const unreadCount = notifications.filter(n => !n.read).length;
  
  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.read;
    return n.type === activeFilter;
  });

  const sortedNotifications = [...filteredNotifications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // ─── Load Notifications ──────────────────────────────────────
  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationsApi.getNotifications();
      setNotifications(data);
    } catch (err: any) {
      console.error('Failed to load notifications:', err);
      setError(err.message || 'Failed to load notifications');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // ─── Handlers ──────────────────────────────────────────────────
  const markAsRead = async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await notificationsApi.deleteNotification(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const clearAll = async () => {
    try {
      await notificationsApi.clearAll();
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  // ─── Navigation ──────────────────────────────────────────────
  const goToDashboard = () => {
    setShowProfileMenu(false);
    navigate('/driver');
  };

  const goToProfile = () => {
    setShowProfileMenu(false);
    navigate('/driver/profile');
  };

  const goToSettings = () => {
    setShowProfileMenu(false);
    navigate('/driver/settings');
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    navigate('/login');
  };

  // ─── Format Time ──────────────────────────────────────────────
  const formatTime = (date: string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  // ─── Loading State ────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#EDF0F8] font-['Inter',sans-serif] p-3 sm:p-5 lg:p-7">
        <div className="w-full max-w-[1180px] mx-auto">
          <div className="flex items-center justify-center h-[60vh]">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#12B2E4] border-t-transparent"></div>
              <p className="mt-3 text-sm text-gray-500">Loading notifications...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#EDF0F8] font-['Inter',sans-serif] p-3 sm:p-5 lg:p-7">
      <div className="w-full max-w-[1180px] mx-auto">

        {/* ─── HEADER ────────────────────────────────────────────── */}
        <header className="shrink-0 bg-gradient-to-r from-[#0B1739] via-[#12204A] to-[#2B4B9E] rounded-[16px] sm:rounded-[20px] px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-7 flex flex-wrap items-center justify-between text-white relative">
          <div className="absolute inset-0 rounded-[16px] sm:rounded-[20px] overflow-hidden pointer-events-none">
            <div className="absolute right-[-60px] top-[-90px] w-[200px] h-[200px] lg:w-[260px] lg:h-[260px] rounded-full bg-[rgba(18,178,228,0.28)]" />
          </div>

          <div className="relative z-10 flex items-center gap-3 sm:gap-4 flex-1 min-w-[180px]">
            <button
              onClick={goToDashboard}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/16 text-white px-2.5 py-2 sm:px-3.5 rounded-[11px] text-[13px] sm:text-[13.5px] font-medium transition-all active:scale-95"
            >
              <FaArrowLeft size={14} />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-[12px] sm:text-[13.5px] font-medium text-white/65 mb-0.5 sm:mb-1">
                {greeting}
              </p>
              <h1 className="font-['Space_Grotesk',sans-serif] text-[20px] sm:text-[23px] lg:text-[26px] font-bold tracking-[-0.02em]">
                Notifications
              </h1>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 sm:gap-2.5 mt-2 sm:mt-0">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1.5 bg-white/8 border border-white/16 text-white px-2.5 py-2 sm:px-3.5 rounded-[11px] text-[13px] sm:text-[13.5px] font-medium hover:bg-white/16 active:scale-95 transition-all"
              >
                <FaCheck size={12} />
                <span className="hidden sm:inline">Mark all read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 bg-white/8 border border-white/16 text-white px-2.5 py-2 sm:px-3.5 rounded-[11px] text-[13px] sm:text-[13.5px] font-medium hover:bg-white/16 active:scale-95 transition-all"
              >
                <FaTrash size={12} />
                <span className="hidden sm:inline">Clear all</span>
              </button>
            )}

            <div className="relative ml-1">
              <div
                onClick={() => setShowProfileMenu(v => !v)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-[#12B2E4] to-[#2B4B9E] flex items-center justify-center font-['Space_Grotesk',sans-serif] font-semibold text-sm border-2 border-white/30 cursor-pointer transition-all"
              >
                {driverInitials}
              </div>

              {showProfileMenu && (
                <div className="absolute right-0 top-[calc(100%+0.5rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-56 py-3 z-50 border border-gray-100 dark:border-gray-700 text-gray-900 dark:text-white">
                  <div className="px-5 pb-3 mb-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{driverEmail}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Driver Account</p>
                  </div>
                  <button onClick={goToProfile} className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <FaUser size={14} className="text-[#2B4B9E]" />
                    View Profile
                  </button>
                  <button onClick={goToSettings} className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <svg className="w-4 h-4 text-[#2B4B9E]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    Settings
                  </button>
                  <div className="h-px bg-gray-100 dark:bg-gray-700 my-2" />
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ─── CONTENT ────────────────────────────────────────────── */}
        <div className="mt-4 sm:mt-6">

          {/* ─── Error Message ──────────────────────────────────── */}
          {error && (
            <div className="flex items-center gap-3 p-4 mb-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <span>❌</span>
              <span className="flex-1">{error}</span>
              <button onClick={() => setError(null)} className="text-red-700 hover:text-red-900">×</button>
            </div>
          )}

          {/* ─── Filter Tabs ────────────────────────────────────── */}
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mb-4 sm:mb-6">
            {FILTER_TABS.map((tab) => {
              const count = tab.id === 'all' 
                ? notifications.length 
                : tab.id === 'unread' 
                  ? unreadCount 
                  : notifications.filter(n => n.type === tab.id).length;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-[12px] font-medium transition-all ${
                    activeFilter === tab.id
                      ? 'bg-[#2B4B9E] text-white shadow-md'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-[#E5E9F3]'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${
                    activeFilter === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ─── Notifications List ────────────────────────────── */}
          <div className="bg-white rounded-[16px] sm:rounded-[18px] border border-[#E5E9F3] shadow-[0_10px_30px_-18px_rgba(19,35,82,0.25)] overflow-hidden">
            {sortedNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                  <FaBell className="text-3xl sm:text-4xl text-gray-300" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-700">No notifications</h3>
                <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-sm">
                  {activeFilter === 'all' 
                    ? "You're all caught up! New notifications will appear here." 
                    : `No ${activeFilter} notifications at the moment.`}
                </p>
                {activeFilter !== 'all' && (
                  <button
                    onClick={() => setActiveFilter('all')}
                    className="mt-3 text-[#12B2E4] text-sm font-medium hover:underline"
                  >
                    View all notifications
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-[#F1F3F8]">
                {sortedNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 cursor-pointer transition-all hover:bg-gray-50 ${
                      !notification.read ? 'bg-[#F7F9FD] border-l-4 border-l-[#12B2E4]' : ''
                    }`}
                  >
                    {/* Icon */}
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      !notification.read ? 'bg-[#12B2E4]/10' : 'bg-gray-100'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className={`text-[13px] sm:text-[14px] font-semibold ${
                            !notification.read ? 'text-gray-900' : 'text-gray-600'
                          }`}>
                            {notification.title}
                          </h4>
                          <p className="text-[12px] sm:text-[13px] text-gray-500 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-[#12B2E4]" />
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                          >
                            <FaTrash size={11} />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px] sm:text-[11px] text-gray-400">
                          {formatTime(notification.createdAt)}
                        </span>
                        {notification.type && (
                          <span className={`text-[9px] sm:text-[10px] font-medium px-1.5 py-0.5 rounded-full uppercase ${
                            notification.type === 'alert' ? 'bg-rose-50 text-rose-600' :
                            notification.type === 'trip' ? 'bg-blue-50 text-blue-600' :
                            notification.type === 'handover' ? 'bg-purple-50 text-purple-600' :
                            notification.type === 'maintenance' ? 'bg-amber-50 text-amber-600' :
                            'bg-gray-100 text-gray-500'
                          }`}>
                            {notification.type}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── Footer ──────────────────────────────────────────── */}
          {notifications.length > 0 && (
            <div className="mt-3 text-center">
              <span className="text-[11px] text-gray-400">
                Showing {sortedNotifications.length} of {notifications.length} notifications
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;