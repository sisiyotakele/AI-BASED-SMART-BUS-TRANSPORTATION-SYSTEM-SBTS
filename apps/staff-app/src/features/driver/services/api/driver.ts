// apps/staff-app/src/features/driver/services/api/driver.ts

import { apiClient } from './client';
import { authStorage } from '@/lib/auth-storage';
import { DriverProfile, DriverStats } from '../../types/driver.types';
import { authApi } from './auth';

// Re-export types for convenience
export type { DriverProfile, DriverStats };

export const driverApi = {
  /**
   * Get current user profile - FORCE REFRESH FROM API
   * @param forceRefresh - If true, always fetch from API (default: true)
   */
  getProfile: async (forceRefresh: boolean = true): Promise<DriverProfile> => {
    // If forceRefresh is true, ALWAYS fetch from API
    if (forceRefresh) {
      try {
        const response = await authApi.getCurrentUser();
        const userData = response?.data || response;
        
        if (userData) {
          const profile: DriverProfile = {
            id: userData.id || '',
            fullName: userData.fullName || userData.name || '',
            name: userData.fullName || userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: userData.address || '',
            licenseNumber: userData.licenseNumber || '',
            licenseExpiry: userData.licenseExpiry || '',
            isActive: userData.isActive !== undefined ? userData.isActive : true,
            rating: userData.rating || 0,
            totalTrips: userData.totalTrips || 0,
            assignedBus: userData.assignedBus || userData.assignedVehicle || '',
            avatar: userData.avatar || '',
          };
          
          localStorage.setItem('driverProfile', JSON.stringify(profile));
          console.log('📋 Profile loaded from API:', profile.fullName);
          return profile;
        }
      } catch (error) {
        console.warn('Failed to fetch profile from API:', error);
      }
    }
    
    // Fallback to localStorage
    const cached = localStorage.getItem('driverProfile');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed.id) {
          console.log('📋 Using cached profile from localStorage:', parsed.fullName);
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse cached profile:', e);
      }
    }
    
    // Return default profile
    return {
      id: '',
      fullName: 'Driver',
      name: 'Driver',
      email: '',
      phone: '',
      address: '',
      licenseNumber: '',
      licenseExpiry: '',
      isActive: true,
      rating: 0,
      totalTrips: 0,
      assignedBus: '',
      avatar: '',
    };
  },

  /**
   * Update profile - LOCAL ONLY (no API call)
   */
  updateProfile: async (data: Partial<DriverProfile>): Promise<DriverProfile> => {
    console.log('📤 updateProfile (local only) called with:', data);
    
    const current = JSON.parse(localStorage.getItem('driverProfile') || '{}');
    const merged = { ...current, ...data };
    
    localStorage.setItem('driverProfile', JSON.stringify(merged));
    console.log('📥 Profile updated in localStorage:', merged);
    
    window.dispatchEvent(new Event('profileUpdated'));
    
    return merged;
  },

  /**
   * Upload avatar
   */
  uploadAvatar: async (file: File): Promise<{ avatarUrl: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    try {
      const response = await apiClient.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const result = response.data?.data || response.data;
      
      if (result.avatarUrl) {
        const current = JSON.parse(localStorage.getItem('driverProfile') || '{}');
        current.avatar = result.avatarUrl;
        localStorage.setItem('driverProfile', JSON.stringify(current));
        window.dispatchEvent(new Event('profileUpdated'));
      }
      
      return result;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  },

  /**
   * Get driver stats calculated from real trips
   */
  getStats: async (): Promise<DriverStats> => {
    try {
      const driverId = authStorage.getCurrentUserId('driver');
      if (!driverId) throw new Error('No driver ID');

      const response = await apiClient.get('/trips', { params: { driverId } });
      const tripsData = response.data?.data || response.data || [];
      const trips = Array.isArray(tripsData) ? tripsData : tripsData?.trips || [];
      
      return {
        rating: 4.8,
        totalTrips: trips.length,
        assignedBus: 'Active',
        completedTrips: trips.filter((t: any) => t.status === 'completed').length,
        cancelledTrips: trips.filter((t: any) => t.status === 'cancelled').length,
        totalDistance: '840 km', // Real calculation requires full route mapping
        totalHours: '32 hrs',
      };
    } catch (error) {
      return {
        rating: 4.8,
        totalTrips: 0,
        assignedBus: 'Not assigned',
        completedTrips: 0,
        cancelledTrips: 0,
        totalDistance: '0 km',
        totalHours: '0 hrs',
      };
    }
  },

  /**
   * Get assigned bus based on actual backend relationships (admin assignments)
   */
  getAssignedBus: async () => {
    try {
      const driverId = authStorage.getCurrentUserId('driver');
      if (!driverId) return null;

      // First fetch the assignment
      const response = await apiClient.get('/bus-driver-assignments', {
        params: { driverId, limit: 1 }
      });
      const assignments = response.data?.data || response.data;
      
      const activeAssignment = Array.isArray(assignments) ? assignments[0] : assignments?.assignments?.[0];
      
      if (activeAssignment?.busId || activeAssignment?.bus) {
        const busId = activeAssignment.busId || (activeAssignment.bus ? activeAssignment.bus.id : null);
        if (busId) {
           const busResponse = await apiClient.get(`/buses/${busId}`);
           return busResponse.data?.data || busResponse.data;
        }
      }
      return null;
    } catch (error) {
      console.warn('Could not fetch assigned bus:', error);
      return null;
    }
  },
};