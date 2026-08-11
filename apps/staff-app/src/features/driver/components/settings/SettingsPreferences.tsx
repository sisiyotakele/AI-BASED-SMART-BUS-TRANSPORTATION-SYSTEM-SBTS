// src/features/driver/components/settings/SettingsPreferences.tsx

import React from 'react';
import { FaMapMarkerAlt, FaBus } from 'react-icons/fa';
import { SettingsSection } from '../shared/SettingsSection';
import ToggleSwitch from '../ToggleSwitch';

interface PreferenceSettings {
  gps: boolean;
  autoStart: boolean;
  stopAlerts: boolean;
  darkMode: boolean;
}

interface SettingsPreferencesProps {
  preferences: PreferenceSettings;
  onToggle: (key: keyof PreferenceSettings) => void;
}

export const SettingsPreferences: React.FC<SettingsPreferencesProps> = ({
  preferences,
  onToggle,
}) => {
  return (
    <>
      <SettingsSection title="GPS & Location" icon={<FaMapMarkerAlt className="text-[#12B2E4]" />}>
        <div className="flex items-center justify-between py-2.5 sm:py-3">
          <div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm sm:text-[14.5px]">
              Real-Time GPS Tracking
            </p>
            <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400">
              Allows SBFMS to monitor your current route
            </p>
          </div>
          <ToggleSwitch
            checked={preferences.gps}
            onChange={() => onToggle('gps')}
          />
        </div>
      </SettingsSection>

      <SettingsSection title="Trip Preferences" icon={<FaBus className="text-[#12B2E4]" />}>
        <div className="flex items-center justify-between py-2.5 sm:py-3 border-t border-gray-200 dark:border-gray-700 first:border-t-0 first:pt-0">
          <div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm sm:text-[14.5px]">
              Auto Start Trip
            </p>
            <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400">
              Automatically start assigned trips
            </p>
          </div>
          <ToggleSwitch
            checked={preferences.autoStart}
            onChange={() => onToggle('autoStart')}
          />
        </div>

        <div className="flex items-center justify-between py-2.5 sm:py-3 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm sm:text-[14.5px]">
              Stop Alerts
            </p>
            <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400">
              Receive upcoming stop notifications
            </p>
          </div>
          <ToggleSwitch
            checked={preferences.stopAlerts}
            onChange={() => onToggle('stopAlerts')}
          />
        </div>
      </SettingsSection>
    </>
  );
};