// src/features/driver/components/history/IncidentHistoryTable.tsx

import React from 'react';
import { IncidentReport } from '../../types';

interface IncidentHistoryTableProps {
  incidents: IncidentReport[];
}

const STATUS_CONFIG: Record<IncidentReport['status'], { color: string; bg: string; icon: string }> = {
  "Reported": { color: "text-[#12B2E4]", bg: "bg-[#12B2E4]/10", icon: "🕐" },
  "In Progress": { color: "text-[#2B4B9E]", bg: "bg-[#2B4B9E]/10", icon: "🔧" },
  "Resolved": { color: "text-green-600", bg: "bg-green-100", icon: "✅" },
};

export const IncidentHistoryTable: React.FC<IncidentHistoryTableProps> = ({ incidents }) => {
  if (incidents.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-gray-400 dark:text-gray-500">
        No incidents found.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead className="bg-[#2B4B9E] text-white">
          <tr>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">#</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Type</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Description</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Location</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Time</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {incidents.map((inc) => {
            const config = STATUS_CONFIG[inc.status];
            return (
              <tr key={inc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-400 dark:text-gray-500 font-mono">#{inc.id.toString().slice(-6)}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-gray-800 dark:text-white">{inc.type}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 max-w-xs truncate">{inc.description}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 font-mono text-[10px] sm:text-xs">{inc.location}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs">{inc.time}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                    {config.icon}
                    {inc.status}
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