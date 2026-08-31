// src/features/driver/components/settings/SettingsPreferences.tsx

import React from 'react';
import { FaMapMarkerAlt, FaBus, FaRoute } from 'react-icons/fa';
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
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Control your location and GPS preferences
        </p>
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
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Customize how trips are handled
        </p>
        <div className="flex items-center justify-between py-2.5 sm:py-3">
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

        <div className="flex items-center justify-between py-2.5 sm:py-3 border-t border-gray-200 dark:border-gray-700">
          <div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm sm:text-[14.5px]">
              <FaRoute className="inline mr-1 text-[#12B2E4]" />
              Route Optimization
            </p>
            <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400">
              AI-based route suggestions
            </p>
          </div>
          <ToggleSwitch
            checked={preferences.autoStart}
            onChange={() => onToggle('autoStart')}
          />
        </div>
      </SettingsSection>
    </>
  );
};