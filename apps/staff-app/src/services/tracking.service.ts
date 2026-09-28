import api from '@/lib/api';
import { ApiResponse, Tracking } from '@/types';

class TrackingService {
    async getAllActiveLocations(): Promise<Tracking[]> {
        const response = await api.get<ApiResponse<Tracking[]>>('/tracking');
        return response.data.data || [];
    }

    async getBusLocation(busId: string): Promise<Tracking> {
        const response = await api.get<ApiResponse<Tracking>>(`/tracking/${busId}`);
        if (!response.data.data) {
            throw new Error('Bus location not found');
        }
        return response.data.data;
    }
}

export const trackingService = new TrackingService();
