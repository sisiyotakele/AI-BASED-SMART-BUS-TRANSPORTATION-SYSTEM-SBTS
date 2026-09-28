// apps/staff-app/src/features/driver/services/api/auth.ts

import { apiClient, setAuthToken, removeAuthToken } from './client';

interface LoginRequest {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      fullName: string;
      phone: string;
      role: string;
    };
  };
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post('/auth/login', data);
    
    if (response.data?.data?.accessToken) {
      setAuthToken(response.data.data.accessToken);
      
      // Store driver ID for trips API
      if (response.data.data.user?.id) {
        localStorage.setItem('driverId', response.data.data.user.id);
      }
    }
    
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Ignore errors on logout
    }
    removeAuthToken();
    localStorage.removeItem('driverId');
  },

  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh');
    if (response.data?.data?.accessToken) {
      setAuthToken(response.data.data.accessToken);
    }
    return response.data;
  },
};