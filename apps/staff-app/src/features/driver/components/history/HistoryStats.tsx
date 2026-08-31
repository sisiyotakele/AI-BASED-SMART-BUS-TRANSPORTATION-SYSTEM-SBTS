// src/features/driver/components/history/HistoryStats.tsx

import React from 'react';
import { FaBus, FaCheckCircle, FaRoute } from 'react-icons/fa';

interface HistoryStatsProps {
  totalTrips: number;
  completedTrips: number;
  totalDistance: number;
  tripGrowth?: number; // Add growth prop
}

export const HistoryStats: React.FC<HistoryStatsProps> = ({
  totalTrips,
  completedTrips,
  totalDistance,
  tripGrowth = 0,
}) => {
  const completionRate = totalTrips > 0 
    ? ((completedTrips / totalTrips) * 100).toFixed(0) 
    : '0';

  const stats = [
    {
      label: 'Total Trips',
      value: totalTrips,
      subtext: tripGrowth > 0 
        ? `+${tripGrowth}% from last month` 
        : tripGrowth < 0 
        ? `${tripGrowth}% from last month` 
        : 'No change from last month',
      icon: <FaBus />,
      color: 'border-l-[#12B2E4]',
      bgColor: 'bg-[#12B2E4]/10',
      textColor: 'text-[#12B2E4]',
    },
    {
      label: 'Completed',
      value: completedTrips,
      subtext: `${completionRate}% completion rate`,
      icon: <FaCheckCircle />,
      color: 'border-l-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/30',
      textColor: 'text-green-600 dark:text-green-400',
    },
    {
      label: 'Total Distance',
      value: `${totalDistance.toFixed(1)} km`,
      subtext: 'Across all trips',
      icon: <FaRoute />,
      color: 'border-l-[#2B4B9E]',
      bgColor: 'bg-[#2B4B9E]/10 dark:bg-[#2B4B9E]/20',
      textColor: 'text-[#2B4B9E] dark:text-[#12B2E4]',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 border-l-4 ${stat.color}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{stat.value}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{stat.subtext}</p>
            </div>
            <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center ${stat.textColor} text-xl`}>
              {stat.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};