import api from '@/lib/api';
import { AuthResponse, ApiResponse } from '@/types';
import { authStorage, getActivePortal } from '@/lib/auth-storage';

export const authService = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
        return data.data!;
    },

    logout: async (): Promise<void> => {
        const refreshToken = authStorage.getRefreshToken(getActivePortal());
        await api.post('/auth/logout', { refreshToken });
    },

    refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
        const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/refresh-token', { refreshToken });
        return data.data!;
    },

    getMe: async (): Promise<AuthResponse['user']> => {
        const { data } = await api.get<ApiResponse<AuthResponse['user']>>('/auth/me');
        return data.data!;
    },

    changePassword: async (currentPassword: string, newPassword: string): Promise<{ message: string }> => {
        const { data } = await api.post<ApiResponse<{ message: string }>>('/auth/change-password', {
            currentPassword,
            newPassword,
        });
        return data.data!;
    },

    forgotPassword: async (email: string): Promise<{ message: string }> => {
        const { data } = await api.post<ApiResponse<{ message: string }>>('/auth/forgot-password', {
            email,
        });
        return data.data!;
    },

    resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
        const { data } = await api.post<ApiResponse<{ message: string }>>('/auth/reset-password', {
            token,
            newPassword,
        });
        return data.data!;
    },
};
