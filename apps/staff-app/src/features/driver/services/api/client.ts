// apps/staff-app/src/features/driver/services/api/client.ts

import axios from 'axios';
import { authStorage } from '@/lib/auth-storage';

// ─── Vite uses import.meta.env for environment variables ───
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// ─── Request Interceptor ─────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    const token = authStorage.getAccessToken('driver');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('❌ Driver API Error:', error.response?.status, error.response?.data);
    // Explicitly removed aggressive window.location.href='/login' redirect
    // so the driver panel doesn't instantly crash if a single endpoint returns 401.
    if (error.response?.status === 401) {
       console.warn('Driver API got 401 Unauthorized, but ignoring aggressive redirect.');
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string) => {
  authStorage.setAccessToken(token, 'driver');
};

export const getAuthToken = () => {
  return authStorage.getAccessToken('driver');
};

export const removeAuthToken = () => {
  authStorage.removeAccessToken('driver');
};