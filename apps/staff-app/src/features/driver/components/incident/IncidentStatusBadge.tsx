// src/features/driver/components/incident/IncidentStatusBadge.tsx

import React from 'react';
import { FaClock, FaWrench, FaCheckCircle } from 'react-icons/fa';

interface IncidentStatusBadgeProps {
  status: "Reported" | "In Progress" | "Resolved";
}

const STATUS_CONFIG = {
  "Reported": {
    color: "text-[#12B2E4]",
    bg: "bg-[#12B2E4]/10",
    icon: <FaClock size={12} />,
  },
  "In Progress": {
    color: "text-[#2B4B9E]",
    bg: "bg-[#2B4B9E]/10",
    icon: <FaWrench size={12} />,
  },
  "Resolved": {
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-100 dark:bg-green-900/30",
    icon: <FaCheckCircle size={12} />,
  },
};

export const IncidentStatusBadge: React.FC<IncidentStatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status];
  
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      {config.icon}
      {status}
    </span>
  );
};