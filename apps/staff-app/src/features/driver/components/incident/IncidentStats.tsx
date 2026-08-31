// src/features/driver/components/incident/IncidentStats.tsx

import React from 'react';
import { FaExclamationTriangle, FaClock, FaCheckCircle } from 'react-icons/fa';
import { Incident } from '../../pages/IncidentPage';

interface IncidentStatsProps {
  incidents: Incident[];
}

export const IncidentStats: React.FC<IncidentStatsProps> = ({ incidents }) => {
  const total = incidents.length;
  const reported = incidents.filter(i => i.status === "Reported").length;
  const inProgress = incidents.filter(i => i.status === "In Progress").length;
  const resolved = incidents.filter(i => i.status === "Resolved").length;

  const stats = [
    { label: 'Total', value: total, icon: <FaExclamationTriangle />, color: 'text-[#12B2E4]', bg: 'bg-[#12B2E4]/10' },
    { label: 'Reported', value: reported, icon: <FaClock />, color: 'text-[#12B2E4]', bg: 'bg-[#12B2E4]/10' },
    { label: 'In Progress', value: inProgress, icon: <FaClock />, color: 'text-[#2B4B9E]', bg: 'bg-[#2B4B9E]/10' },
    { label: 'Resolved', value: resolved, icon: <FaCheckCircle />, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' },
  ];

  // Don't show stats if no incidents
  if (total === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 opacity-50">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.bg} rounded-full flex items-center justify-center ${stat.color}`}>
                {stat.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-400 dark:text-gray-600">{stat.value}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 ${stat.bg} rounded-full flex items-center justify-center ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};