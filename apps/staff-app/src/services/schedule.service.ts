import api from '@/lib/api';
import { ApiResponse, RouteSchedule } from '@/types';

class ScheduleService {
    async getAll(filters?: { routeId?: string; dayOfWeek?: string }): Promise<RouteSchedule[]> {
        const response = await api.get<ApiResponse<RouteSchedule[]>>('/schedules', { params: filters });
        return response.data.data || [];
    }

    async getById(id: string): Promise<RouteSchedule> {
        const response = await api.get<ApiResponse<RouteSchedule>>(`/schedules/${id}`);
        if (!response.data.data) {
            throw new Error('Schedule not found');
        }
        return response.data.data;
    }

    async create(data: Partial<RouteSchedule>): Promise<RouteSchedule> {
        const response = await api.post<ApiResponse<RouteSchedule>>('/schedules', data);
        if (!response.data.data) {
            throw new Error('Failed to create schedule');
        }
        return response.data.data;
    }

    async update(id: string, data: Partial<RouteSchedule>): Promise<RouteSchedule> {
        const response = await api.patch<ApiResponse<RouteSchedule>>(`/schedules/${id}`, data);
        if (!response.data.data) {
            throw new Error('Failed to update schedule');
        }
        return response.data.data;
    }

    async delete(id: string): Promise<void> {
        await api.delete<ApiResponse<void>>(`/schedules/${id}`);
    }
}

export const scheduleService = new ScheduleService();
