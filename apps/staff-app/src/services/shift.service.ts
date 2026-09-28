import api from '@/lib/api';
import { Shift, ApiResponse } from '@/types';

export const shiftService = {
    getAll: async (driverId?: string, date?: string): Promise<Shift[]> => {
        const params: any = {};
        if (driverId && driverId !== 'all') params.driverId = driverId;
        if (date) params.date = date;

        const { data } = await api.get<ApiResponse<Shift[]>>('/shifts', { params });
        return data.data || [];
    },

    getById: async (id: string): Promise<Shift> => {
        const { data } = await api.get<ApiResponse<Shift>>(`/shifts/${id}`);
        return data.data!;
    },

    create: async (shift: Partial<Shift>): Promise<Shift> => {
        const { data } = await api.post<ApiResponse<Shift>>('/shifts', shift);
        return data.data!;
    },

    update: async (id: string, shift: Partial<Shift>): Promise<Shift> => {
        const { data } = await api.patch<ApiResponse<Shift>>(`/shifts/${id}`, shift);
        return data.data!;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/shifts/${id}`);
    },

};
