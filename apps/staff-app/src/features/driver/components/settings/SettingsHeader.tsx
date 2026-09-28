// src/features/driver/components/settings/SettingsHeader.tsx

import React from 'react';

interface SettingsHeaderProps {
  title: string;
  subtitle: string;
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  title,
  subtitle,
}) => {
  return (
    <div className="p-4 sm:p-5 mb-4 sm:mb-5 bg-white dark:bg-gray-800 border-l-4 border-[#12B2E4] rounded-lg shadow-sm transition-colors duration-300">
      <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">{title}</h1>
      <p className="mt-1 text-xs sm:text-sm text-gray-500 dark:text-gray-400">{subtitle}</p>
    </div>
  );
};