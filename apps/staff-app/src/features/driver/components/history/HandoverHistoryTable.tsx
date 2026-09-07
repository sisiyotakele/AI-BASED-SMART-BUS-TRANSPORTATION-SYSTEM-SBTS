// src/features/driver/components/history/HandoverHistoryTable.tsx

import React from 'react';
import { FaExchangeAlt, FaArrowRight } from 'react-icons/fa';
import { getInitials } from '../../utils';

interface HandoverRecord {
  id: string;
  currentDriver?: string;
  nextDriver?: string;
  bus?: string;
  vehicleCondition?: string; // Excellent | Good | Fair | Poor
  status?: string;           // Pending | Accepted | Completed | Rejected
  date?: string;
}

interface HandoverHistoryTableProps {
  handovers: HandoverRecord[];
}

const statusStyles: Record<string, string> = {
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Accepted: 'bg-[#E8F6FC] text-[#0E86AC] border-[#BFE9F5]',
  Completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Rejected: 'bg-rose-50 text-rose-700 border-rose-200',
};

const conditionStyles: Record<string, string> = {
  Excellent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Fair: 'bg-amber-50 text-amber-700 border-amber-200',
  Poor: 'bg-rose-50 text-rose-700 border-rose-200',
};

const Badge: React.FC<{ label?: string; styles: Record<string, string> }> = ({ label, styles }) => {
  const cls = styles[label || ''] || 'bg-gray-50 text-gray-600 border-gray-200';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-medium border ${cls}`}>
      {label || 'Unknown'}
    </span>
  );
};

const MiniAvatar: React.FC<{ name?: string }> = ({ name }) => (
  <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#12B2E4] to-[#2B4B9E] text-white text-[10.5px] font-semibold flex items-center justify-center shrink-0">
    {getInitials(name || '?')}
  </span>
);

const formatDate = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return value;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const HandoverHistoryTable: React.FC<HandoverHistoryTableProps> = ({ handovers }) => {
  if (!handovers || handovers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-14 text-center">
        <div className="w-14 h-14 rounded-full bg-[#EDF0F8] flex items-center justify-center mb-3">
          <FaExchangeAlt className="text-[#2B4B9E]/50" size={18} />
        </div>
        <p className="text-sm font-semibold text-gray-700">No handovers found</p>
        <p className="text-xs text-gray-400 mt-1">Vehicle handovers you're part of will show up here.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#E5E9F3]">
            <th className="py-3 px-4 text-[12.5px] font-medium text-gray-500">Handover</th>
            <th className="py-3 px-4 text-[12.5px] font-medium text-gray-500 hidden md:table-cell">Bus</th>
            <th className="py-3 px-4 text-[12.5px] font-medium text-gray-500">Condition</th>
            <th className="py-3 px-4 text-[12.5px] font-medium text-gray-500 hidden sm:table-cell">Date</th>
            <th className="py-3 px-4 text-[12.5px] font-medium text-gray-500">Status</th>
          </tr>
        </thead>
        <tbody>
          {handovers.map((h, idx) => (
            <tr
              key={h.id ?? idx}
              className="border-b border-[#F1F3F9] last:border-b-0 hover:bg-[#F7F9FD] transition-colors"
            >
              <td className="py-3.5 px-4">
                <div className="flex items-center gap-2">
                  <MiniAvatar name={h.currentDriver} />
                  <span className="text-[13px] font-medium text-[#0B1739] max-w-[90px] truncate">
                    {h.currentDriver || 'Unknown'}
                  </span>
                  <FaArrowRight className="text-gray-300 shrink-0" size={11} />
                  <MiniAvatar name={h.nextDriver} />
                  <span className="text-[13px] font-medium text-[#0B1739] max-w-[90px] truncate">
                    {h.nextDriver || 'Unknown'}
                  </span>
                </div>
              </td>
              <td className="py-3.5 px-4 hidden md:table-cell">
                <span className="text-[13px] text-gray-500">{h.bus || '—'}</span>
              </td>
              <td className="py-3.5 px-4">
                <Badge label={h.vehicleCondition} styles={conditionStyles} />
              </td>
              <td className="py-3.5 px-4 hidden sm:table-cell">
                <span className="text-[13px] text-gray-500">{formatDate(h.date)}</span>
              </td>
              <td className="py-3.5 px-4">
                <Badge label={h.status} styles={statusStyles} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default HandoverHistoryTable;