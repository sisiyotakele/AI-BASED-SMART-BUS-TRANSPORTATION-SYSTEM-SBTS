// src/features/driver/components/history/MaintenanceHistoryTable.tsx

import React from 'react';
import { MaintenanceRequest } from '../../types';
import { FaWrench } from 'react-icons/fa';

interface MaintenanceHistoryTableProps {
  requests: MaintenanceRequest[];
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  "Pending": { color: "text-[#12B2E4]", bg: "bg-[#12B2E4]/10", icon: "🕐" },
  "In Progress": { color: "text-[#2B4B9E]", bg: "bg-[#2B4B9E]/10", icon: "🔧" },
  "Completed": { color: "text-green-600", bg: "bg-green-100", icon: "✅" },
};

export const MaintenanceHistoryTable: React.FC<MaintenanceHistoryTableProps> = ({ requests }) => {
  if (requests.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <FaWrench className="text-2xl text-gray-300 dark:text-gray-500" />
        </div>
        <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300">No maintenance requests</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Maintenance API integration coming soon
        </p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          You can request maintenance from the dashboard
        </p>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    if (priority === "high" || priority === "urgent") return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
    if (priority === "medium") return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
    return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead className="bg-[#2B4B9E] text-white">
          <tr>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">#</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Type</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Description</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Priority</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Date</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {requests.map((req) => {
            const config = STATUS_CONFIG[req.status] || STATUS_CONFIG["Pending"];
            return (
              <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-400 dark:text-gray-500 font-mono">#{req.id.toString().slice(-6)}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-gray-800 dark:text-white">{req.type}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">{req.description}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3">
                  <span className={`text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full ${getPriorityColor(req.priority)}`}>
                    {req.priority}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs">{req.date}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                    {config.icon}
                    {req.status}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};