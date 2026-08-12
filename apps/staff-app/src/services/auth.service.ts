import api from '@/lib/api';
import { AuthResponse, ApiResponse } from '@/types';

export const authService = {
    login: async (email: string, password: string): Promise<AuthResponse> => {
        const { data } = await api.post<ApiResponse<AuthResponse>>('/auth/login', { email, password });
        return data.data!;
    },

    logout: async (): Promise<void> => {
        const refreshToken = localStorage.getItem('refreshToken');
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
};
