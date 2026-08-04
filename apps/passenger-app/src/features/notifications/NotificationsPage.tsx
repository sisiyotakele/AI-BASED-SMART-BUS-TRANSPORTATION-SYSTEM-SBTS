// src/features/notifications/NotificationsPage.tsx
import React from "react";
// 1. Fixed import path relative to this file
import NotificationList from "./NotificationList";

export const NotificationsPage = () => {
  return (
    <div className="space-y-4">
      <div className="border-b border-slate-700/60 pb-3">
        <h2 className="text-lg font-bold text-white">Notifications</h2>
        <p className="text-xs text-slate-400">
          Stay updated on your schedule, routes, and delay alerts.
        </p>
      </div>

      <div className="max-h-[60vh] overflow-y-auto pr-1">
        <NotificationList />
      </div>
    </div>
  );
};

export default NotificationsPage;