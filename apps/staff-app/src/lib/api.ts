import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { config } from './config';
import toast from 'react-hot-toast';

export const api = axios.create({
    baseURL: config.apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - add auth token
api.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
        const token = localStorage.getItem('accessToken');
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - handle errors and token refresh
api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError<{ message?: string; error?: string }>) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 - Token expired
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                if (!refreshToken) {
                    throw new Error('No refresh token');
                }

                const { data } = await axios.post(`${config.apiBaseUrl}/auth/refresh-token`, {
                    refreshToken,
                });

                // Handle the response structure - backend returns { success, message, data: { accessToken, refreshToken } }
                const newAccessToken = data.data?.accessToken || data.accessToken;
                const newRefreshToken = data.data?.refreshToken || data.refreshToken;

                if (!newAccessToken) {
                    throw new Error('No access token in refresh response');
                }

                localStorage.setItem('accessToken', newAccessToken);
                if (newRefreshToken) {
                    localStorage.setItem('refreshToken', newRefreshToken);
                }

                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                }

                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed - logout user
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // Handle other errors
        const message = error.response?.data?.message || error.response?.data?.error || error.message || 'An error occurred';

        // Don't show toast for 401 errors (handled by redirect) or permission errors
        if (originalRequest.url?.includes('/ai-prediction/models/active') && error.response?.status === 404) {
            // Silently ignore 404 for AI model check (expected when no model is active)
        } else if (error.response?.status !== 401 && error.response?.status !== 403) {
            toast.error(message);
        } else if (error.response?.status === 403) {
            // Show permission error but don't redirect
            toast.error('You don\'t have permission to perform this action');
        }

        return Promise.reject(error);
    }
);

export default api;
