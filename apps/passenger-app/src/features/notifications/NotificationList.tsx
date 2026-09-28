// src/features/notifications/NotificationList.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Bell, AlertTriangle, CheckCircle2, Info, Clock, Check, RefreshCw, Sparkles, Send, Filter, MapPin, Bus } from "lucide-react";
import { notificationsApi } from "@/lib/api";
import { subscribeToNotifications } from "@/lib/socket";
import { normalizeNotificationFromBackend } from "@/lib/liveData";
import { useAuth } from "@/features/auth/AuthContext";
import {
  getStoredProximityAlerts,
  markProximityAlertAsRead,
  markAllProximityAlertsAsRead,
  ProximityAlert
} from "@/lib/proximityAlerts";

export interface NotificationItem {
  id: string;
  type: "alert" | "warning" | "success" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
  corridor?: string;
  isProximity?: boolean;
}

export const NotificationList: React.FC = () => {
  const { isGuest } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [filter, setFilter] = useState<"all" | "unread" | "alerts" | "updates" | "proximity">("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Fetch notifications from GET /notifications combined with real-time proximity alerts
  const fetchNotificationsData = useCallback(async () => {
    if (isGuest) {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    setIsRefreshing(true);
    try {
      const storedProximity = getStoredProximityAlerts().map((item: ProximityAlert) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        message: item.message,
        time: item.time || "Recently",
        read: item.read,
        corridor: item.corridor || item.stationName,
        isProximity: true,
      }));

      const listRes = await notificationsApi.getNotifications({ limit: 50 });
      let items: NotificationItem[] = [];

      if (listRes.data?.success && Array.isArray(listRes.data?.data) && listRes.data.data.length > 0) {
        items = listRes.data.data.map((entry: Record<string, unknown>) => normalizeNotificationFromBackend(entry));
      }

      // Combine proximity alerts with backend notifications
      const combined = [...storedProximity, ...items];

      if (combined.length > 0) {
        setNotifications(combined);
        setUnreadCount(combined.filter((n) => !n.read).length);
      } else {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.warn("Could not reach /notifications API, using stored & AI defaults:", err);
      const storedProximity = getStoredProximityAlerts().map((item: ProximityAlert) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        message: item.message,
        time: item.time || "Recently",
        read: item.read,
        corridor: item.corridor || item.stationName,
        isProximity: true,
      }));
      setNotifications(storedProximity);
      setUnreadCount(storedProximity.filter((n) => !n.read).length);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isGuest]);

  useEffect(() => {
    fetchNotificationsData();

    // Listen for WebSocket notifications
    const unsubscribeSocket = subscribeToNotifications((evt) => {
      if (evt && evt.message) {
        const isProx = evt.title?.toLowerCase().includes("approaching") || evt.type === "alert";
        const newItem: NotificationItem = {
          id: `ws-${Date.now()}`,
          type: evt.type === "warning" ? "warning" : evt.type === "alert" ? "alert" : "info",
          title: evt.title || (isProx ? "Station Proximity Alert" : "Live Transit Update"),
          message: evt.message,
          time: "Just now",
          read: false,
          isProximity: isProx,
        };
        setNotifications((prev) => [newItem, ...prev]);
        setUnreadCount((prev) => prev + 1);
      }
    });

    // Listen for custom client-side proximity events
    const handleProximityEvent = (e: Event) => {
      const customEvent = e as CustomEvent<ProximityAlert>;
      if (customEvent.detail) {
        const prox = customEvent.detail;
        const newItem: NotificationItem = {
          id: prox.id,
          type: prox.type,
          title: prox.title,
          message: prox.message,
          time: "Just now",
          read: false,
          corridor: prox.corridor,
          isProximity: true,
        };
        setNotifications((prev) => [newItem, ...prev.filter((n) => n.id !== newItem.id)]);
        setUnreadCount((prev) => prev + 1);
      }
    };

    window.addEventListener("sbts:new_notification", handleProximityEvent);

    return () => {
      unsubscribeSocket();
      window.removeEventListener("sbts:new_notification", handleProximityEvent);
    };
  }, [fetchNotificationsData, isGuest]);

  // Mark notification as read via PATCH /notifications/{id}/read & local proximity store
  const handleMarkAsRead = async (id: string) => {
    markProximityAlertAsRead(id);
    try {
      await notificationsApi.markAsRead(id);
    } catch (err) {
      console.warn(`Marking notification ${id} as read locally:`, err);
    } finally {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllRead = async () => {
    markAllProximityAlertsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  // Simulate a test live alert
  const handleSendTestAlert = () => {
    const testAlerts = [
      { title: "Route 12 → Megenagna Station", message: "Route 12 • Next: Megenagna Station • ~2 min left", type: "alert" as const, isProximity: true },
      { title: "Mexico Square Traffic Delay", message: "Traffic queue detected at Mexico Square. Route 08 buses delayed by +6 mins.", type: "warning" as const, isProximity: false },
      { title: "Route 04 → Bole Airport Terminal", message: "Route 04 • Next: Bole Airport Terminal • ~1 min left", type: "alert" as const, isProximity: true },
    ];
    const picked = testAlerts[Math.floor(Math.random() * testAlerts.length)];
    const newItem: NotificationItem = {
      id: `sim-${Date.now()}`,
      title: picked.title,
      message: picked.message,
      type: picked.type,
      time: "Just now",
      read: false,
      isProximity: picked.isProximity,
    };
    setNotifications((prev) => [newItem, ...prev]);
    setUnreadCount((prev) => prev + 1);
  };

  const filteredItems = notifications.filter((item) => {
    if (filter === "unread") return !item.read;
    if (filter === "proximity") return !!item.isProximity;
    if (filter === "alerts") return item.type === "alert" || item.type === "warning";
    if (filter === "updates") return item.type === "info" || item.type === "success";
    return true;
  });

  if (isLoading) {
    return (
      <div className="py-8 text-center text-slate-400 text-xs font-semibold animate-pulse">
        Loading notifications from server...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* HEADER CONTROLS & FILTER TABS */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-[#1B2A4A] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({notifications.length})
          </button>

          <button
            onClick={() => setFilter("unread")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === "unread"
                ? "bg-[#1B2A4A] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-rose-500 text-white font-extrabold">
                {unreadCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setFilter("alerts")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filter === "alerts"
                ? "bg-amber-600 text-white shadow-xs"
                : "bg-amber-50 text-amber-800 hover:bg-amber-100"
            }`}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>Delays &amp; Alerts</span>
          </button>

          <button
            onClick={() => setFilter("updates")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filter === "updates"
                ? "bg-indigo-600 text-white shadow-xs"
                : "bg-indigo-50 text-indigo-800 hover:bg-indigo-100"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>AI Updates</span>
          </button>
          <button
            onClick={() => setFilter("proximity")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
              filter === "proximity"
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            }`}
          >
            <MapPin className="w-3 h-3" />
            <span>Station Proximity</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Simulate Live Alert Button */}
          <button
            onClick={handleSendTestAlert}
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1 cursor-pointer transition-colors"
            title="Simulate a live transit delay alert"
          >
            <Send className="w-3 h-3" />
            <span>Test Alert</span>
          </button>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer transition-colors px-2 py-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
          )}

          <button
            onClick={fetchNotificationsData}
            disabled={isRefreshing}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh Notifications"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-2">
          <Bell className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-700 text-sm">No notifications found</h4>
          <p className="text-xs text-slate-400">
            {filter === "unread"
              ? "You have read all your alerts!"
              : filter === "proximity"
              ? "No station proximity alerts recorded yet. As buses approach stops on the live map, alerts will appear here automatically."
              : "We will notify you here about transit delays and schedule updates."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => !item.read && handleMarkAsRead(item.id)}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                item.read
                  ? "bg-white border-slate-200/80 opacity-80"
                  : item.isProximity
                  ? "bg-emerald-50/60 border-emerald-300 shadow-2xs hover:border-emerald-400"
                  : "bg-indigo-50/40 border-indigo-200/90 shadow-2xs hover:border-indigo-300"
              }`}
            >
              {/* Category Icon */}
              <div className="mt-0.5 shrink-0">
                {item.isProximity ? (
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl animate-pulse">
                    <Bus className="w-4 h-4" />
                  </div>
                ) : (item.type === "alert" || item.type === "warning") ? (
                  <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                ) : item.type === "success" ? (
                  <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="p-2 bg-indigo-100 text-indigo-800 rounded-xl">
                    <Info className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Simplified Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 truncate">
                      {item.title}
                    </h4>
                    {item.isProximity && (
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-black rounded-md shrink-0">
                        Arrival Alert
                      </span>
                    )}
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0" title="Unread"></span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 font-bold flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {item.time}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-700 mt-1 leading-normal">
                  {item.message}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationList;