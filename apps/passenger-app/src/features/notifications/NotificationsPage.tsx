// src/features/notifications/NotificationsPage.tsx
import React from "react";
import NotificationList from "./NotificationList";

export const NotificationsPage = () => {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-1">
        <h2 className="text-xl font-extrabold text-slate-900">Notifications & Transit Alerts</h2>
        <p className="text-xs text-slate-500 font-normal">
          Stay updated on your schedule, bus corridor traffic, and real-time boarding alerts across Addis Ababa.
        </p>
      </div>

      <NotificationList />
    </div>
  );
};

export default NotificationsPage;