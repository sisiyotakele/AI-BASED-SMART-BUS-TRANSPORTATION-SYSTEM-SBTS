// src/features/driver/components/NotificationPopup.tsx

import React, { useEffect, useState } from "react";
import {
  FaBell,
  FaRoute,
  FaExclamationTriangle,
  FaBullhorn,
} from "react-icons/fa";

// ================================================================
// TYPES
// ================================================================

interface Notification {
  id: number;
  type: string;
  message: string;
  time: string;
  read: boolean;
}

interface NotificationPopupProps {
  notification: Notification | null;
  onClose: () => void;
}

// ================================================================
// NOTIFICATION POPUP COMPONENT
// ================================================================

const NotificationPopup: React.FC<NotificationPopupProps> = ({
  notification,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // ─── Auto-hide after 5 seconds ─────────────────────────────────

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300);
    }, 5000);

    return () => clearTimeout(timer);
  }, [notification, onClose]);

  // ─── If notification is null, don't render ─────────────────────

  if (!notification) return null;
  if (!isVisible) return null;

  // ─── Get Icon ───────────────────────────────────────────────────
  // Neutral, single-tone icon — no per-category color coding.

  const getIcon = (type: string) => {
    switch (type) {
      case "Route Updates":
        return <FaRoute />;
      case "Traffic Alerts":
        return <FaExclamationTriangle />;
      case "Emergency Messages":
        return <FaExclamationTriangle />;
      case "Dispatch Communications":
        return <FaBullhorn />;
      default:
        return <FaBell />;
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "88px",
        right: "20px",
        width: "320px",
        maxWidth: "calc(100vw - 40px)",
        backgroundColor: "#ffffff",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 10px 25px rgba(0,0,0,0.12)",
        padding: "16px",
        zIndex: 999,
        boxSizing: "border-box",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            width: "36px",
            height: "36px",
            borderRadius: "9999px",
            backgroundColor: "#f3f4f6",
            color: "#6b7280",
            fontSize: "15px",
          }}
        >
          {getIcon(notification.type)}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ display: "block", fontSize: "13px", color: "#111827" }}>
            {notification.type || "General"}
          </strong>
          <p style={{ margin: "4px 0", fontSize: "13.5px", color: "#374151", lineHeight: 1.4 }}>
            {notification.message}
          </p>
          <span style={{ fontSize: "11px", color: "#9ca3af" }}>{notification.time}</span>
        </div>

        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          aria-label="Dismiss notification"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            width: "22px",
            height: "22px",
            padding: 0,
            margin: 0,
            borderRadius: "9999px",
            border: "none",
            backgroundColor: "transparent",
            color: "#9ca3af",
            fontSize: "13px",
            lineHeight: 1,
            cursor: "pointer",
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
};

export default NotificationPopup;