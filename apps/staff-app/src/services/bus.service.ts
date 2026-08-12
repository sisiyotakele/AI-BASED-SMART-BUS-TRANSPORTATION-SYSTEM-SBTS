import api from '@/lib/api';
import { Bus, ApiResponse } from '@/types';

export const busService = {
    getAll: async (search?: string, terminalId?: string, status?: string): Promise<Bus[]> => {
        const params: any = {};
        if (search) params.search = search;
        if (terminalId && terminalId !== 'all') params.terminalId = terminalId;
        if (status && status !== 'all') params.status = status;

        const { data } = await api.get<ApiResponse<Bus[]>>('/buses', { params });
        return data.data || [];
    },

    getById: async (id: string): Promise<Bus> => {
        const { data } = await api.get<ApiResponse<Bus>>(`/buses/${id}`);
        return data.data!;
    },

    create: async (bus: Partial<Bus>): Promise<Bus> => {
        const { data } = await api.post<ApiResponse<Bus>>('/buses', bus);
        return data.data!;
    },

    update: async (id: string, bus: Partial<Bus>): Promise<Bus> => {
        const { data } = await api.patch<ApiResponse<Bus>>(`/buses/${id}`, bus);
        return data.data!;
    },

    updateMaintenanceStatus: async (id: string, status: string): Promise<Bus> => {
        const { data } = await api.patch<ApiResponse<Bus>>(`/buses/${id}/maintenance-status`, { status });
        return data.data!;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/buses/${id}`);
    }
};
