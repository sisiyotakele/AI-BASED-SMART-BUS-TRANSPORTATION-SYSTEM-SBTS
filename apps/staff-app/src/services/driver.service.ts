import api from '@/lib/api';
import { Driver, ApiResponse } from '@/types';

export const driverService = {
    getAll: async (search?: string, terminalId?: string, isActive?: boolean): Promise<Driver[]> => {
        const params: any = {};
        if (search) params.search = search;
        if (terminalId && terminalId !== 'all') params.terminalId = terminalId;
        if (isActive !== undefined) params.isActive = isActive;

        const { data } = await api.get<ApiResponse<Driver[]>>('/drivers', { params });
        return data.data || [];
    },

    getById: async (id: string): Promise<Driver> => {
        const { data } = await api.get<ApiResponse<Driver>>(`/drivers/${id}`);
        return data.data!;
    },

    create: async (driver: Partial<Driver>): Promise<Driver> => {
        const { data } = await api.post<ApiResponse<Driver>>('/drivers', driver);
        return data.data!;
    },

    update: async (id: string, driver: Partial<Driver>): Promise<Driver> => {
        const { data } = await api.patch<ApiResponse<Driver>>(`/drivers/${id}`, driver);
        return data.data!;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/drivers/${id}`);
    }
};
