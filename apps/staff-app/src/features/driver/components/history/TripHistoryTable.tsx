// src/features/driver/components/history/TripHistoryTable.tsx

import React from 'react';
import { FaChevronRight, FaBus, FaMapMarkerAlt, FaEye } from 'react-icons/fa';
import Button from '../Button';
import { Trip } from '../../types';

interface TripHistoryTableProps {
  trips: Trip[];
  onViewTrip: (trip: Trip) => void;
  formatDate: (date: string) => string;
}

const STATUS_CONFIG: Record<Trip['status'], { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  Completed: {
    color: "text-green-600 dark:text-green-400",
    bg: "bg-green-50 dark:bg-green-900/30",
    icon: <span className="text-green-500 dark:text-green-400">✓</span>,
    label: "Completed",
  },
  Delayed: {
    color: "text-yellow-600 dark:text-yellow-400",
    bg: "bg-yellow-50 dark:bg-yellow-900/30",
    icon: <span className="text-yellow-500 dark:text-yellow-400">⏰</span>,
    label: "Delayed",
  },
  Cancelled: {
    color: "text-red-600 dark:text-red-400",
    bg: "bg-red-50 dark:bg-red-900/30",
    icon: <span className="text-red-500 dark:text-red-400">✕</span>,
    label: "Cancelled",
  },
  "In-progress": {
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/30",
    icon: <span className="text-blue-500 dark:text-blue-400 animate-spin">⟳</span>,
    label: "In-progress",
  },
};

export const TripHistoryTable: React.FC<TripHistoryTableProps> = ({
  trips,
  onViewTrip,
  formatDate,
}) => {
  if (trips.length === 0) {
    return (
      <div className="text-center py-10 text-sm text-gray-400 dark:text-gray-500">
        No trips match your filters.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs sm:text-sm">
        <thead className="bg-[#2B4B9E] text-white">
          <tr>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">TRIP ID</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">DATE</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">ROUTE</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">TIME</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">BUS</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">STATUS</th>
            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-[10px] sm:text-xs font-semibold uppercase tracking-wider">ACTION</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
          {trips.map((trip) => {
            const statusConfig = STATUS_CONFIG[trip.status];
            return (
              <tr key={trip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <td className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-[#12B2E4]">{trip.tripId}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3">
                  <div className="font-semibold text-gray-800 dark:text-white">{formatDate(trip.date)}</div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500">{trip.date}</div>
                </td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{trip.route}</span>
                    <span className="px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white bg-[#12B2E4] rounded">{trip.routeCode}</span>
                  </div>
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                    <FaMapMarkerAlt size={9} /> {trip.routeType} · {trip.stops} stops · {trip.distance}
                  </div>
                </td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 text-gray-600 dark:text-gray-400">{trip.time}</td>
                <td className="px-3 sm:px-4 py-2 sm:py-3 font-semibold text-[#12B2E4]">
                  <FaBus className="inline mr-1" size={11} /> {trip.bus}
                </td>
                <td className="px-3 sm:px-4 py-2 sm:py-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                    {statusConfig.icon}
                    {statusConfig.label}
                  </span>
                </td>
                <td className="px-3 sm:px-4 py-2 sm:py-3">
                  <Button
                    text="View"
                    variant="outline"
                    size="sm"
                    icon={<FaEye size={12} />}
                    onClick={() => onViewTrip(trip)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};