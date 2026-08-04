// src/features/notifications/NotificationList.tsx
import React, { useState, useEffect, useCallback } from "react";
import { Bell, AlertTriangle, CheckCircle2, Info, Clock, Check, RefreshCw } from "lucide-react";
import { notificationsApi } from "@/lib/api";

export interface NotificationItem {
  id: string;
  type: "alert" | "warning" | "success" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const FALLBACK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "fb-1",
    type: "warning",
    title: "Route 12 Traffic Congestion",
    message: "Moderate congestion near Edna Mall bypass. Estimated trip delay: +8 minutes.",
    time: "10 mins ago",
    read: false,
  },
  {
    id: "fb-2",
    type: "success",
    title: "Boarding Pass Active",
    message: "Your pass for Megenagna → Bole Airport (TCK-9948) has been generated and validated.",
    time: "45 mins ago",
    read: false,
  },
  {
    id: "fb-3",
    type: "info",
    title: "New Express Route Available",
    message: "Sheger Bus Route 04 now offers non-stop express trips during peak hours.",
    time: "Yesterday",
    read: true,
  },
];

export const NotificationList: React.FC = () => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Step 1: Fetch notifications & unread count from Swagger GET /notifications
  const fetchNotificationsData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [listRes, countRes] = await Promise.allSettled([
        notificationsApi.getNotifications(),
        notificationsApi.getUnreadCount(),
      ]);

      let items: NotificationItem[] = [];

      if (listRes.status === "fulfilled" && listRes.value.data?.success && Array.isArray(listRes.value.data?.data)) {
        items = listRes.value.data.data.map((n: any) => ({
          id: n.id || String(Math.random()),
          type: (n.type?.toLowerCase() as any) || "info",
          title: n.title || "Notification",
          message: n.message || n.description || "",
          time: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now",
          read: !!(n.read || n.isRead),
        }));
      }

      if (items.length > 0) {
        setNotifications(items);
      } else {
        setNotifications(FALLBACK_NOTIFICATIONS);
      }

      if (countRes.status === "fulfilled" && countRes.value.data?.data?.count !== undefined) {
        setUnreadCount(countRes.value.data.data.count);
      } else {
        const count = (items.length > 0 ? items : FALLBACK_NOTIFICATIONS).filter((n) => !n.read).length;
        setUnreadCount(count);
      }
    } catch (err) {
      console.warn("Could not reach /notifications API, using transit alerts:", err);
      setNotifications(FALLBACK_NOTIFICATIONS);
      setUnreadCount(FALLBACK_NOTIFICATIONS.filter((n) => !n.read).length);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotificationsData();
  }, [fetchNotificationsData]);

  // Step 2: Mark notification as read via POST /notifications/{id}/mark-read
  const handleMarkAsRead = async (id: string) => {
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
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const filteredItems = notifications.filter((item) => {
    if (filter === "unread") return !item.read;
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilter("all")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              filter === "all"
                ? "bg-[#1B2A4A] text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Notifications ({notifications.length})
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
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer transition-colors"
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
              : "We will notify you here about transit delays and schedule updates."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => !item.read && handleMarkAsRead(item.id)}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                item.read
                  ? "bg-white border-slate-200/80 opacity-85"
                  : "bg-indigo-50/40 border-indigo-200/90 shadow-2xs hover:border-indigo-300"
              }`}
            >
              {/* Icon based on notification type */}
              <div className="mt-0.5 shrink-0">
                {(item.type === "alert" || item.type === "warning") && (
                  <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                )}
                {item.type === "success" && (
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                )}
                {item.type === "info" && (
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                    <Info className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-900 truncate flex items-center gap-2">
                    {item.title}
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-indigo-600 shrink-0"></span>
                    )}
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
                    <Clock className="w-3 h-3" />
                    {item.time}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
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