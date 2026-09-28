// src/features/driver/hooks/useDriverSettings.ts

import { useState, useEffect, useCallback } from 'react';
import { storage } from '../utils';

interface NotificationSettings {
  trip: boolean;
  traffic: boolean;
  incident: boolean;
  emergency: boolean;
}

interface PreferenceSettings {
  gps: boolean;
  autoStart: boolean;
  stopAlerts: boolean;
  darkMode: boolean;
}

export const useDriverSettings = () => {
  const [notifications, setNotifications] = useState<NotificationSettings>({
    trip: true,
    traffic: true,
    incident: false,
    emergency: true,
  });

  const [preferences, setPreferences] = useState<PreferenceSettings>({
    gps: true,
    autoStart: false,
    stopAlerts: true,
    darkMode: false,
  });

  const loadSettings = useCallback(() => {
    const savedSettings = storage.get<any>('driverSettings', {});
    const savedTheme = storage.get<string>('theme', 'light');

    if (savedSettings.notifications) {
      setNotifications(savedSettings.notifications);
    }
    if (savedSettings.preferences) {
      setPreferences({
        ...savedSettings.preferences,
        darkMode: savedTheme === 'dark',
      });
    }
  }, []);

  const saveSettings = useCallback(() => {
    const data = {
      notifications,
      preferences,
    };
    storage.set('driverSettings', data);
    storage.set('theme', preferences.darkMode ? 'dark' : 'light');

    // Apply theme
    if (preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    window.dispatchEvent(new Event('settingsUpdated'));
    window.dispatchEvent(new Event('storage'));
  }, [notifications, preferences]);

  const toggleNotification = useCallback((key: keyof NotificationSettings) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const togglePreference = useCallback((key: keyof PreferenceSettings) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      
      // Handle dark mode immediately
      if (key === 'darkMode') {
        if (updated.darkMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        storage.set('theme', updated.darkMode ? 'dark' : 'light');
      }
      
      return updated;
    });
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    notifications,
    preferences,
    setNotifications,
    setPreferences,
    loadSettings,
    saveSettings,
    toggleNotification,
    togglePreference,
  };
};