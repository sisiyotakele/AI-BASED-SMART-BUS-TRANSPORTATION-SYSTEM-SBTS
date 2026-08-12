import api from '../lib/api';

export interface PriceData {
    id: string;
    routeId: string;
    fromStopId: string;
    toStopId: string;
    basePrice: number;
    peakPrice?: number | null;
    offPeakPrice?: number | null;
    effectiveFrom: string;
    effectiveUntil?: string | null;
    isActive: boolean;
    createdAt: string;
    route?: { routeName: string };
    fromStop?: { stopName: string };
    toStop?: { stopName: string };
}

export interface PriceStats {
    total: number;
    active: number;
    inactive: number;
    avgBasePrice: number;
}

class PricingService {
    async getPrices(params?: {
        routeId?: string;
        fromStopId?: string;
        toStopId?: string;
        isActive?: boolean;
        page?: number;
        limit?: number;
    }): Promise<{ data: PriceData[]; total: number }> {
        const response = await api.get('/pricing', { params });
        return response.data.data;
    }

    async getStats(): Promise<PriceStats> {
        const response = await api.get('/pricing/stats');
        return response.data.data;
    }

    async calculatePrice(params: {
        routeId: string;
        fromStopId: string;
        toStopId: string;
        isPeak?: boolean;
    }): Promise<{ price: number; type: string }> {
        const response = await api.get('/pricing/calculate', { params });
        return response.data.data;
    }

    async createPrice(data: {
        routeId: string;
        fromStopId: string;
        toStopId: string;
        basePrice: number;
        peakPrice?: number;
        offPeakPrice?: number;
        effectiveFrom?: string;
        effectiveUntil?: string;
    }): Promise<PriceData> {
        const response = await api.post('/pricing', data);
        return response.data.data;
    }

    async updatePrice(id: string, data: Partial<{
        basePrice: number;
        peakPrice: number;
        offPeakPrice: number;
        effectiveFrom: string;
        effectiveUntil: string;
    }>): Promise<PriceData> {
        const response = await api.patch(`/pricing/${id}`, data);
        return response.data.data;
    }

    async deletePrice(id: string): Promise<void> {
        await api.delete(`/pricing/${id}`);
    }
}

export const pricingService = new PricingService();
