import api from '@/lib/api';
import { Route, ApiResponse } from '@/types';

export const routeService = {
    getAll: async (search?: string): Promise<Route[]> => {
        const { data } = await api.get<ApiResponse<Route[]>>('/routes-stops/routes', {
            params: { search }
        });
        return data.data || [];
    },

    getById: async (id: string): Promise<Route> => {
        const { data } = await api.get<ApiResponse<Route>>(`/routes-stops/routes/${id}`);
        return data.data!;
    },

    create: async (route: Partial<Route>): Promise<Route> => {
        const { data } = await api.post<ApiResponse<Route>>('/routes-stops/routes', route);
        return data.data!;
    },

    update: async (id: string, route: Partial<Route>): Promise<Route> => {
        const { data } = await api.patch<ApiResponse<Route>>(`/routes-stops/routes/${id}`, route);
        return data.data!;
    },

    delete: async (id: string): Promise<void> => {
        await api.delete(`/routes-stops/routes/${id}`);
    },

    getVersions: async (id: string): Promise<any[]> => {
        const { data } = await api.get(`/routes-stops/routes/${id}/versions`);
        return data.data || [];
    },

    createVersion: async (id: string, payload?: any): Promise<any> => {
        const { data } = await api.post(`/routes-stops/routes/${id}/versions`, payload || {});
        return data.data!;
    },

    addRouteStop: async (versionId: string, payload: { stopId: string, sequenceNumber: number, estimatedMinutes?: number, distanceKm?: number }): Promise<any> => {
        const { data } = await api.post(`/routes-stops/route-versions/${versionId}/stops`, payload);
        return data.data!;
    },

    overwriteVersionStops: async (versionId: string, payload: { routeStops: any[] }): Promise<any> => {
        const { data } = await api.put(`/routes-stops/route-versions/${versionId}/stops`, payload);
        return data.data!;
    }
};
