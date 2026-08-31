// src/features/driver/components/incident/IncidentList.tsx

import React from 'react';
import { FaEye } from 'react-icons/fa';
import { Incident } from '../../pages/IncidentPage';
import { IncidentStatusBadge } from './IncidentStatusBadge';
import { Pagination } from '../shared/Pagination';

interface IncidentListProps {
  incidents: Incident[];
  onView: (incident: Incident) => void;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  totalItems: number;
}

const TYPE_ICONS: Record<string, string> = {
  'Heavy traffic': '🚦',
  'Vehicle mechanical issue': '🔧',
  'Passenger issue': '👤',
  'Bad weather': '🌧️',
  'Road closure': '🚧',
  'Other': '📌',
};

export const IncidentList: React.FC<IncidentListProps> = ({
  incidents,
  onView,
  currentPage,
  totalPages,
  itemsPerPage,
  onPageChange,
  totalItems,
}) => {
  if (incidents.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-12 text-center">
        <div className="w-20 h-20 mx-auto bg-[#12B2E4]/10 rounded-full flex items-center justify-center text-[#12B2E4] text-4xl mb-4">
          <span>🚨</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">No incidents reported yet</h3>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Submit your first incident report above</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="px-4 sm:px-6 py-4 bg-gradient-to-r from-[#12B2E4]/10 to-[#2B4B9E]/10 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📊</span> All Incidents
            <span className="ml-2 px-2 py-0.5 bg-[#2B4B9E] text-white rounded-full text-xs">
              {totalItems}
            </span>
          </h4>
        </div>
      </div>

      <div className="overflow-x-auto p-4 sm:p-6">
        <table className="w-full text-xs sm:text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider">#</th>
              <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider">Type</th>
              <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider">Description</th>
              <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider">Location</th>
              <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider">Time</th>
              <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider">Status</th>
              <th className="text-left py-3 px-3 sm:px-4 font-semibold text-gray-500 dark:text-gray-400 text-[10px] sm:text-xs uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="py-3 px-3 sm:px-4 text-gray-400 dark:text-gray-500 text-[10px] sm:text-xs font-mono">
                  #{incident.id.toString().slice(-6)}
                </td>
                <td className="py-3 px-3 sm:px-4">
                  <span className="flex items-center gap-2 font-medium text-gray-800 dark:text-white">
                    <span>{TYPE_ICONS[incident.type] || '📋'}</span>
                    {incident.type}
                  </span>
                </td>
                <td className="py-3 px-3 sm:px-4 text-gray-600 dark:text-gray-400 max-w-xs truncate">
                  {incident.description}
                </td>
                <td className="py-3 px-3 sm:px-4 text-gray-600 dark:text-gray-400 font-mono text-[10px] sm:text-xs">
                  {incident.location}
                </td>
                <td className="py-3 px-3 sm:px-4 text-gray-600 dark:text-gray-400 text-[10px] sm:text-xs">
                  {incident.time}
                </td>
                <td className="py-3 px-3 sm:px-4">
                  <IncidentStatusBadge status={incident.status} />
                </td>
                <td className="py-3 px-3 sm:px-4">
                  <button
                    onClick={() => onView(incident)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#12B2E4] hover:text-[#0e9ed4] hover:bg-[#12B2E4]/5 rounded-lg transition-colors touch-manipulation"
                  >
                    <FaEye size={11} />
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={onPageChange}
        label="incidents"
      />
    </div>
  );
};