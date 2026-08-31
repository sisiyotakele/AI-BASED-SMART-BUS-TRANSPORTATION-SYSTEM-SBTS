// src/features/driver/components/settings/SettingsNotifications.tsx

import React from 'react';
import { FaBell } from 'react-icons/fa';
import { SettingsSection } from '../shared/SettingsSection';
import ToggleSwitch from '../ToggleSwitch';

interface NotificationSettings {
  trip: boolean;
  traffic: boolean;
  incident: boolean;
  emergency: boolean;
}

interface SettingsNotificationsProps {
  notifications: NotificationSettings;
  onToggle: (key: keyof NotificationSettings) => void;
}

export const SettingsNotifications: React.FC<SettingsNotificationsProps> = ({
  notifications,
  onToggle,
}) => {
  const items = [
    { 
      key: 'trip' as const, 
      label: 'Trip Updates', 
      description: 'Receive assignment and route updates' 
    },
    { 
      key: 'traffic' as const, 
      label: 'Traffic Alerts', 
      description: 'AI traffic prediction warnings' 
    },
    { 
      key: 'incident' as const, 
      label: 'Incident Alerts', 
      description: 'Emergency and incident notifications' 
    },
    { 
      key: 'emergency' as const, 
      label: 'Emergency Messages', 
      description: 'Important safety messages' 
    },
  ];

  return (
    <SettingsSection title="Notification Preferences" icon={<FaBell className="text-[#12B2E4]" />}>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        Choose which notifications you want to receive
      </p>
      {items.map((item, index) => (
        <div
          key={item.key}
          className={`flex items-center justify-between py-2.5 sm:py-3 ${
            index > 0 ? 'border-t border-gray-200 dark:border-gray-700' : ''
          }`}
        >
          <div>
            <p className="font-semibold text-gray-800 dark:text-white text-sm sm:text-[14.5px]">
              {item.label}
            </p>
            <p className="text-xs sm:text-[13px] text-gray-500 dark:text-gray-400">
              {item.description}
            </p>
          </div>
          <ToggleSwitch
            checked={notifications[item.key]}
            onChange={() => onToggle(item.key)}
          />
        </div>
      ))}
    </SettingsSection>
  );
};