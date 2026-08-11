// src/features/driver/types/driver.types.ts

export interface DriverProfile {
  name: string;
  phone: string;
  email: string;
  address: string;
  avatar?: string;
}

export interface AccountSettings {
  name: string;
  phone: string;
  email: string;
}

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