// src/features/driver/components/shared/SettingsSection.tsx

import React from 'react';

interface SettingsSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  icon,
  children,
}) => {
  return (
    <div className="p-4 sm:p-5 mb-4 sm:mb-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm transition-colors duration-300">
      <h2 className="flex items-center gap-2 mb-3 sm:mb-4 text-sm sm:text-base font-bold text-gray-800 dark:text-white">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
};