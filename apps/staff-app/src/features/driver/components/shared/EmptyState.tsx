// src/features/driver/components/shared/EmptyState.tsx

import React from 'react';
import { FaBell } from 'react-icons/fa';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <FaBell className="text-3xl sm:text-4xl text-gray-300 dark:text-gray-500" />,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-semibold text-gray-600 dark:text-gray-400">{title}</h3>
      <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};