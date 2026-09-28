import api from '@/lib/api';
import { Stop, ApiResponse } from '@/types';

export const stopService = {
    getAll: async (search?: string): Promise<Stop[]> => {
        const { data } = await api.get<ApiResponse<Stop[]>>('/routes-stops/stops', {
            params: { search }
        });
        return data.data || [];
    },

    getById: async (id: string): Promise<Stop> => {
        const { data } = await api.get<ApiResponse<Stop>>(`/routes-stops/stops/${id}`);
        return data.data!;
    },

    create: async (stop: Partial<Stop>): Promise<Stop> => {
        const sanitized = Object.fromEntries(Object.entries(stop).filter(([_, v]) => v !== ''));
        const { data } = await api.post<ApiResponse<Stop>>('/routes-stops/stops', sanitized);
        return data.data!;
    },

    update: async (id: string, stop: Partial<Stop>): Promise<Stop> => {
        const sanitized = Object.fromEntries(Object.entries(stop).filter(([_, v]) => v !== ''));
        const { data } = await api.patch<ApiResponse<Stop>>(`/routes-stops/stops/${id}`, sanitized);
        return data.data!;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/routes-stops/stops/${id}`);
    }
};
