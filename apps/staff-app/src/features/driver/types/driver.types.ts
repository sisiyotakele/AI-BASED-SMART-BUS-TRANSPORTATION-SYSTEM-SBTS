// src/features/driver/types/driver.types.ts

export interface DriverProfile {
  id: string;
  fullName: string;
  name: string;              // For compatibility with existing components
  phone: string;
  email: string;
  address: string;
  licenseNumber: string;
  licenseExpiry: string;
  licenseType?: string;
  issueDate?: string;
  isActive: boolean;
  verified?: boolean;
  rating?: number;
  totalTrips?: number;
  assignedBus?: string;
  assignedVehicle?: string;
  avatar?: string;
  profileImage?: string;
  profilePicture?: string;
  photo?: string;
  user?: {
    id?: string;
    fullName?: string;
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface DriverStats {
  rating: number;
  totalTrips: number;
  assignedBus: string;
  completedTrips: number;
  cancelledTrips: number;
  totalDistance: string;
  totalHours: string;
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

// Helper type for form data (making all fields optional for editing)
export type DriverProfileFormData = Partial<DriverProfile>;

// Helper type for API responses
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
}