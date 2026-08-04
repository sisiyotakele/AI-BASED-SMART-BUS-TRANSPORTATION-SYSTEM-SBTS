// src/features/notifications/NotificationList.tsx
import React from "react";
import { Bell, AlertTriangle, CheckCircle2, Info, Clock } from "lucide-react";

export interface NotificationItem {
  id: string;
  type: "alert" | "success" | "info";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

export const NotificationList: React.FC = () => {
  const notifications: NotificationItem[] = [
    {
      id: "1",
      type: "alert",
      title: "Route 12 Traffic Delay",
      message: "Moderate congestion near Edna Mall bypass. Estimated delay: +8 minutes.",
      time: "10 mins ago",
      read: false,
    },
    {
      id: "2",
      type: "success",
      title: "Ticket Reserved",
      message: "Your pass for Megenagna → Bole Airport (TCK-102) has been confirmed.",
      time: "1 hour ago",
      read: true,
    },
    {
      id: "3",
      type: "info",
      title: "New Express Route Active",
      message: "Sheger Bus Route 04 now offers non-stop express buses during peak hours.",
      time: "Yesterday",
      read: true,
    },
  ];

  return (
    <div className="space-y-3">
      {notifications.map((item) => (
        <div
          key={item.id}
          className={`p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
            item.read
              ? "bg-slate-50/50 border-slate-100"
              : "bg-indigo-50/30 border-indigo-100 shadow-2xs"
          }`}
        >
          {/* Icon based on notification type */}
          <div className="mt-0.5 shrink-0">
            {item.type === "alert" && (
              <div className="p-2 bg-amber-100 text-amber-700 rounded-lg">
                <AlertTriangle className="w-4 h-4" />
              </div>
            )}
            {item.type === "success" && (
              <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
            {item.type === "info" && (
              <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                <Info className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-xs font-bold text-slate-800 truncate">
                {item.title}
              </h4>
              <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1 shrink-0">
                <Clock className="w-3 h-3" />
                {item.time}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {item.message}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationList;