// src/features/driver/components/trip/TripProgressBar.tsx

import React from 'react';

interface TripProgressBarProps {
  progress: number;
}

export const TripProgressBar: React.FC<TripProgressBarProps> = ({ progress }) => {
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  
  return (
    <div className="bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 sm:h-2 overflow-hidden">
      <div
        className="h-full bg-gradient-to-r from-[#12B2E4] to-[#2B4B9E] transition-all duration-700 ease-out"
        style={{ width: `${clampedProgress}%` }}
      />
    </div>
  );
};