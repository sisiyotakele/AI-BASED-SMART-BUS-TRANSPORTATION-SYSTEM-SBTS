// apps/staff-app/src/features/driver/services/api/settings.ts

export interface NotificationSettings {
  trip: boolean;
  traffic: boolean;
  incident: boolean;
  emergency: boolean;
}

export interface PreferenceSettings {
  gps: boolean;
  autoStart: boolean;
  stopAlerts: boolean;
  darkMode: boolean;
}

export interface AccountSettings {
  name: string;
  phone: string;
  email: string;
  address?: string;
}

export interface DriverSettings {
  account: AccountSettings;
  notifications: NotificationSettings;
  preferences: PreferenceSettings;
}

const SETTINGS_KEY = 'driverSettings';

export const settingsApi = {
  getSettings: (): DriverSettings => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // Return default if parse fails
      }
    }
    
    return {
      account: {
        name: '',
        phone: '',
        email: '',
        address: '',
      },
      notifications: {
        trip: true,
        traffic: true,
        incident: true,
        emergency: true,
      },
      preferences: {
        gps: true,
        autoStart: false,
        stopAlerts: true,
        darkMode: false,
      },
    };
  },

  saveSettings: (settings: DriverSettings): void => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    
    if (settings.preferences.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    window.dispatchEvent(new Event('settingsUpdated'));
  },

  toggleNotification: (key: keyof NotificationSettings): NotificationSettings => {
    const settings = settingsApi.getSettings();
    settings.notifications[key] = !settings.notifications[key];
    settingsApi.saveSettings(settings);
    return settings.notifications;
  },

  togglePreference: (key: keyof PreferenceSettings): PreferenceSettings => {
    const settings = settingsApi.getSettings();
    settings.preferences[key] = !settings.preferences[key];
    settingsApi.saveSettings(settings);
    return settings.preferences;
  },

  toggleDarkMode: (): boolean => {
    const settings = settingsApi.getSettings();
    settings.preferences.darkMode = !settings.preferences.darkMode;
    settingsApi.saveSettings(settings);
    return settings.preferences.darkMode;
  },
};