// src/features/driver/components/history/MaintenanceHistoryTable.tsx

import React from 'react';
import { FaWrench } from 'react-icons/fa';

interface MaintenanceRecord {
  id: string;
  type?: string;
  description?: string;
  priority?: string; // low | medium | high | urgent
  status?: string;    // Pending | In Progress | Completed
  date?: string;
}

interface MaintenanceHistoryTableProps {
  requests: MaintenanceRecord[];
}

const priorityStyles: Record<string, string> = {
  urgent: 'bg-rose-50 text-rose-700 border-rose-200',
  high: 'bg-orange-50 text-orange-700 border-orange-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const statusStyles: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  'In Progress': 'bg-[#E8F6FC] text-[#0E86AC] border-[#BFE9F5]',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const Badge: React.FC<{ label?: string; styles: Record<string, string> }> = ({ label, styles }) => {
  const key = label || '';
  const cls = styles[key] || styles[key.toLowerCase?.() || ''] || 'bg-gray-50 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-medium border capitalize ${cls}`}>
      {label || 'Unknown'}
    </span>
  );
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const MaintenanceHistoryTable: React.FC<MaintenanceHistoryTableProps> = ({ requests }) => {
  if (!requests || requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="w-14 h-14 rounded-full bg-[#EDF0F8] flex items-center justify-center mb-3">
          <FaWrench className="text-[#2B4B9E]/50" size={18} />
        </div>
        <p className="text-sm font-semibold text-gray-700">No maintenance requests</p>
        <p className="text-xs text-gray-400 mt-1">Your vehicle has no open or past requests for this range.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#E5E9F3]">
            <th className="py-3 px-4 text-[12.5px] font-medium text-gray-500">Type</th>
            <th className="py-3 px-4 text-[12.5px] font-medium text-gray-500">Description</th>
            <th className="py-3 px-4 text-[12.5px] font-medium text-gray-500">Priority</th>
            <th className="py-3 px-4 text-[12.5px] font-medium text-gray-500 hidden sm:table-cell">Date</th>
            <th className="py-3 px-4 text-[12.5px] font-medium text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req, idx) => (
            <tr
              key={req.id ?? idx}
              className="border-b border-[#F1F3F9] last:border-b-0 hover:bg-[#F7F9FD] transition-colors"
            >
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg bg-[#EAF0FF] text-[#2B4B9E] flex items-center justify-center shrink-0">
                    <FaWrench size={12} />
                  </span>
                  <span className="text-[13.5px] font-medium text-[#0B1739]">{req.type || 'Maintenance'}</span>
                </div>
              </td>
              <td className="py-3.5 px-4 max-w-[280px]">
                <p className="text-[13px] text-gray-600 truncate">{req.description || '—'}</p>
              </td>
              <td className="py-3.5 px-4">
                <Badge label={req.priority} styles={priorityStyles} />
              </td>
              <td className="py-3.5 px-4 hidden sm:table-cell">
                <span className="text-[13px] text-gray-500">{formatDate(req.date)}</span>
              </td>
              <td className="py-3.5 px-4">
                <Badge label={req.status} styles={statusStyles} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MaintenanceHistoryTable;