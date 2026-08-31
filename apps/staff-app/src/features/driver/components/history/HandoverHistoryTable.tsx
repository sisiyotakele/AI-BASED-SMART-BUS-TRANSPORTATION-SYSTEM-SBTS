// src/features/driver/components/history/HandoverHistoryTable.tsx

import React from 'react';
import { ShiftHandover } from '../../types';

interface HandoverHistoryTableProps {
  handovers: ShiftHandover[];
}

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  "Pending": { color: "text-yellow-600", bg: "bg-yellow-100", icon: "⏳" },
  "Accepted": { color: "text-blue-600", bg: "bg-blue-100", icon: "📋" },
  "Completed": { color: "text-green-600", bg: "bg-green-100", icon: "✅" },
  "Rejected": { color: "text-red-600", bg: "bg-red-100", icon: "❌" },
};

export const HandoverHistoryTable: React.FC<HandoverHistoryTableProps> = ({ handovers }) => {
  if (handovers.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-gray-400 dark:text-gray-500">
        No shift handovers found.
      </div>
    );
  }

  const getVehicleColor = (condition: string) => {
    if (condition === "good") return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
    if (condition === "fair") return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400";
    return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400";
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead className="bg-[#2B4B9E] text-white">
          <tr>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">#</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Current Driver</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Next Driver</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Vehicle</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Date</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {handovers.map((h) => {
            const config = STATUS_CONFIG[h.status] || STATUS_CONFIG["Pending"];
            return (
              <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-400 dark:text-gray-500 font-mono">#{h.id.toString().slice(-6)}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-gray-800 dark:text-white">{h.currentDriver}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 font-medium text-gray-800 dark:text-white">{h.nextDriver}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3">
                  <span className={`text-[10px] sm:text-xs font-medium px-2 py-0.5 rounded-full ${getVehicleColor(h.vehicleCondition)}`}>
                    {h.vehicleCondition}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs">{h.date}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
                    {config.icon}
                    {h.status}
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