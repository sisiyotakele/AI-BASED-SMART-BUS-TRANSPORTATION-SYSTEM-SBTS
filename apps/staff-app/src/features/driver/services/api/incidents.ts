// apps/staff-app/src/features/driver/services/api/incidents.ts

import { apiClient } from './client';
import { authStorage } from '@/lib/auth-storage';

export interface Incident {
  id: number;
  type: string;
  description: string;
  location: string;
  time: string;
  status: string;
  severity?: string;
  latitude?: number;
  longitude?: number;
}

export const incidentsApi = {
  /**
   * Get my incidents
   */
  getMyIncidents: async (params?: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<{ incidents: Incident[]; total: number }> => {
    const driverId = authStorage.getCurrentUserId('driver') || undefined;
    const response = await apiClient.get('/incidents', { params: { ...params, driverId } });
    return response.data.data;
  },

  /**
   * Create an incident - matches backend schema exactly
   */
  create: async (data: {
    tripId: string;
    incidentType: string;
    description: string;
    severity: string;
    latitude?: number;
    longitude?: number;
  }): Promise<Incident> => {
    const payload = {
      tripId: data.tripId,
      incidentType: data.incidentType,
      description: data.description || '',
      severity: data.severity || 'medium',
      latitude: data.latitude,
      longitude: data.longitude,
    };

    console.log('📤 Sending incident payload:', payload);

    const response = await apiClient.post('/incidents', payload);
    return response.data.data;
  },

  /**
   * Update incident status
   */
  updateStatus: async (id: number, status: string): Promise<Incident> => {
    const response = await apiClient.patch(`/incidents/${id}/status`, { status });
    return response.data.data;
  },

  /**
   * Get incident by ID
   */
  getById: async (id: number): Promise<Incident> => {
    const response = await apiClient.get(`/incidents/${id}`);
    return response.data.data;
  },
};