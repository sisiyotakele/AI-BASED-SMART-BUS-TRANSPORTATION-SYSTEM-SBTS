// src/features/driver/components/settings/SettingsAppearance.tsx

import React from 'react';
import { FaMoon } from 'react-icons/fa';
import { SettingsSection } from '../shared/SettingsSection';
import ToggleSwitch from '../ToggleSwitch';

interface PreferenceSettings {
  gps: boolean;
  autoStart: boolean;
  stopAlerts: boolean;
  darkMode: boolean;
}

interface SettingsAppearanceProps {
  darkMode: boolean;
  onToggle: () => void;
}

export const SettingsAppearance: React.FC<SettingsAppearanceProps> = ({
  darkMode,
  onToggle,
}) => {
  return (
    <SettingsSection title="Appearance" icon={<FaMoon className="text-[#12B2E4]" />}>
      <div className="flex items-center justify-between py-2.5 sm:py-3">
        <div>
          <p className="font-semibold text-gray-800 dark:text-white text-sm sm:text-[14.5px]">
            Dark Mode
          </p>
          <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400">
            Change application appearance
          </p>
        </div>
        <ToggleSwitch
          checked={darkMode}
          onChange={onToggle}
        />
      </div>
    </SettingsSection>
  );
};