// src/features/driver/components/trip/TripStatusBadge.tsx

import React from 'react';
import { TripStatus } from '../../types';

interface TripStatusBadgeProps {
  status: TripStatus;
}

const STATUS_CONFIG: Record<TripStatus, { label: string; dot: string; pillBg: string; pillText: string }> = {
  idle: {
    label: 'Not started',
    dot: 'bg-gray-400 dark:bg-gray-500',
    pillBg: 'bg-gray-100 dark:bg-gray-700',
    pillText: 'text-gray-600 dark:text-gray-300',
  },
  running: {
    label: 'Running',
    dot: 'bg-emerald-500 animate-pulse',
    pillBg: 'bg-emerald-50 dark:bg-emerald-900/30',
    pillText: 'text-emerald-600 dark:text-emerald-400',
  },
  paused: {
    label: 'Paused',
    dot: 'bg-amber-500',
    pillBg: 'bg-amber-50 dark:bg-amber-900/30',
    pillText: 'text-amber-600 dark:text-amber-400',
  },
};

export const TripStatusBadge: React.FC<TripStatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status];
  
  return (
    <span className={`flex items-center gap-1 text-[10px] sm:text-xs font-medium px-2 sm:px-3 py-1 sm:py-1.5 rounded-full ${config.pillBg} ${config.pillText}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
};