import api from '@/lib/api';
import { DashboardStats, ApiResponse } from '@/types';

export const dashboardService = {
    getStats: async (): Promise<DashboardStats> => {
        const { data } = await api.get<ApiResponse<DashboardStats>>('/dashboard/stats');
        return data.data!;
    },

    getRecentActivity: async () => {
        const { data } = await api.get<ApiResponse<any>>('/dashboard/recent-activity');
        return data.data!;
    },
};
