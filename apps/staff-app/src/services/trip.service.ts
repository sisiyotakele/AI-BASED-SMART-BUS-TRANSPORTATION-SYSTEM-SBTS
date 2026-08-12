import api from '@/lib/api';
import { ApiResponse, Trip } from '@/types';

class TripService {
    async getAll(filters?: { busId?: string; driverId?: string; status?: string }): Promise<Trip[]> {
        const response = await api.get<ApiResponse<Trip[]>>('/trips', { params: filters });
        return response.data.data || [];
    }

    async getById(id: string): Promise<Trip> {
        const response = await api.get<ApiResponse<Trip>>(`/trips/${id}`);
        if (!response.data.data) {
            throw new Error('Trip not found');
        }
        return response.data.data;
    }

    async create(data: Partial<Trip>): Promise<Trip> {
        const response = await api.post<ApiResponse<Trip>>('/trips', data);
        if (!response.data.data) {
            throw new Error('Failed to create trip');
        }
        return response.data.data;
    }

    async start(id: string): Promise<Trip> {
        const response = await api.patch<ApiResponse<Trip>>(`/trips/${id}/start`);
        return response.data.data!;
    }

    async pause(id: string): Promise<Trip> {
        const response = await api.patch<ApiResponse<Trip>>(`/trips/${id}/pause`);
        return response.data.data!;
    }

    async resume(id: string): Promise<Trip> {
        const response = await api.patch<ApiResponse<Trip>>(`/trips/${id}/resume`);
        return response.data.data!;
    }

    async end(id: string): Promise<Trip> {
        const response = await api.patch<ApiResponse<Trip>>(`/trips/${id}/end`);
        return response.data.data!;
    }

    async cancel(id: string): Promise<Trip> {
        const response = await api.patch<ApiResponse<Trip>>(`/trips/${id}/cancel`);
        return response.data.data!;
    }

    async delete(id: string): Promise<void> {
        await api.delete<ApiResponse<void>>(`/trips/${id}`);
    }
}

export const tripService = new TripService();
