// src/features/driver/components/profile/ProfileStats.tsx

import React from 'react';
import { FaStar, FaBus, FaRoute } from 'react-icons/fa';

interface ProfileStatsProps {
  rating: number;
  assignedBus: string;
  totalTrips: number;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  rating,
  assignedBus,
  totalTrips,
}) => {
  const stats = [
    { icon: <FaStar className="w-4 h-4 mx-auto text-amber-400" />, value: rating.toFixed(1), label: "Rating" },
    { icon: <FaBus className="w-4 h-4 mx-auto text-purple-500" />, value: assignedBus, label: "Assigned bus" },
    { icon: <FaRoute className="w-4 h-4 mx-auto text-green-500" />, value: totalTrips, label: "Total trips" },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 pt-5 mt-5 border-t border-gray-100 dark:border-gray-700">
      {stats.map((stat, index) => (
        <div key={index} className="p-3 text-center rounded-lg bg-gray-50 dark:bg-gray-700">
          {stat.icon}
          <p className="mt-1 text-lg font-bold text-gray-800 dark:text-white">{stat.value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{stat.label}</p>
        </div>
      ))}
    </div>
  );
};