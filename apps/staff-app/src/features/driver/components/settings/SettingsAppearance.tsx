// src/features/driver/components/settings/SettingsAppearance.tsx

import React from 'react';
import { FaMoon, FaSun } from 'react-icons/fa';
import { SettingsSection } from '../shared/SettingsSection';
import ToggleSwitch from '../ToggleSwitch';

interface SettingsAppearanceProps {
  darkMode: boolean;
  onToggle: () => void;
}

export const SettingsAppearance: React.FC<SettingsAppearanceProps> = ({
  darkMode,
  onToggle,
}) => {
  return (
    <SettingsSection 
      title="Appearance" 
      icon={darkMode ? <FaMoon className="text-[#12B2E4]" /> : <FaSun className="text-[#12B2E4]" />}
    >
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Customize how the app looks and feels
      </p>
      <div className="flex items-center justify-between py-2.5 sm:py-3">
        <div>
          <p className="font-semibold text-gray-800 dark:text-white text-sm sm:text-[14.5px]">
            Dark Mode
          </p>
          <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400">
            {darkMode ? 'Dark theme is active' : 'Light theme is active'}
          </p>
        </div>
        <ToggleSwitch
          checked={darkMode}
          onChange={onToggle}
        />
      </div>

      {/* Quick theme preview */}
      <div className="mt-3 p-3 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
        <p className="text-xs text-gray-600 dark:text-gray-300">
          💡 Tip: Dark mode reduces eye strain in low-light environments
        </p>
      </div>
    </SettingsSection>
  );
};