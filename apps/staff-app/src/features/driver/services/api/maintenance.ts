// apps/staff-app/src/features/driver/services/api/maintenance.ts

import { apiClient } from './client';

export interface MaintenanceRequest {
  id: number;
  type: string;
  description: string;
  priority: string;
  date: string;
  status: string;
  vehicle?: string;
  driver?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const maintenanceApi = {
  /**
   * Get maintenance requests for the current driver
   * Uses /maintenance?driverId=DRIVER_ID
   */
  getMyRequests: async (params?: {
    status?: string;
    type?: string;
    page?: number;
    limit?: number;
  }): Promise<{ requests: MaintenanceRequest[]; total: number }> => {
    const driverId = localStorage.getItem('driverId');
    
    if (!driverId) {
      console.warn('No driver ID found in localStorage');
      return { requests: [], total: 0 };
    }

    const response = await apiClient.get('/maintenance', {
      params: {
        driverId: driverId,
        ...params,
      },
    });
    
    const data = response.data?.data || response.data;
    const requests = data?.requests || data || [];
    
    return {
      requests: Array.isArray(requests) ? requests : [],
      total: requests.length || 0,
    };
  },

  /**
   * Create a maintenance request
   */
  create: async (data: {
    type: string;
    description: string;
    priority: string;
    vehicle?: string;
  }): Promise<MaintenanceRequest> => {
    const response = await apiClient.post('/maintenance', data);
    return response.data?.data || response.data;
  },

  /**
   * Update maintenance request status
   */
  updateStatus: async (id: number, status: string): Promise<MaintenanceRequest> => {
    const response = await apiClient.patch(`/maintenance/${id}/status`, { status });
    return response.data?.data || response.data;
  },

  /**
   * Get maintenance request by ID
   */
  getById: async (id: number): Promise<MaintenanceRequest> => {
    const response = await apiClient.get(`/maintenance/${id}`);
    return response.data?.data || response.data;
  },

  /**
   * Cancel maintenance request
   */
  cancel: async (id: number): Promise<MaintenanceRequest> => {
    const response = await apiClient.patch(`/maintenance/${id}/cancel`);
    return response.data?.data || response.data;
  },
};