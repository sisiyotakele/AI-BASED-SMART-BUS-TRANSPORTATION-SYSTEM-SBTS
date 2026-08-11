// src/features/driver/components/trip/TripCard.tsx

import React from 'react';
import { UpcomingTrip } from '../../types';

interface TripCardProps {
  trip: UpcomingTrip;
  onClick?: () => void;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, onClick }) => {
  return (
    <div
      className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 sm:p-4 border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-1">
        <p className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
          {trip.route}
        </p>
        <span className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 font-medium">
          {trip.status}
        </span>
      </div>
      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
        📅 {trip.date} • {trip.time} • {trip.distance}
      </p>
    </div>
  );
};