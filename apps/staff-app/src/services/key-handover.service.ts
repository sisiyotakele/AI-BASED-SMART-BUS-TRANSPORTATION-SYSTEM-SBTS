import api from '../lib/api';

export interface KeyHandover {
    id: string;
    busId: string;
    terminalId: string;
    fromShiftId?: string | null;
    toShiftId: string;
    status: 'pending' | 'confirmed';
    confirmedByFrom: boolean;
    confirmedByTo: boolean;
    handoverTime: string;
    notes?: string;
    bus?: {
        plateNumber: string;
    };
    terminal?: {
        terminalName: string;
    };
    fromShift?: {
        shiftName: string;
        driver: {
            fullName: string;
        };
    };
    toShift?: {
        shiftName: string;
        driver: {
            fullName: string;
        };
    };
}

class KeyHandoverService {
    async getHandovers(params?: { busId?: string; terminalId?: string; status?: string }): Promise<KeyHandover[]> {
        const response = await api.get('/key-handovers', { params });
        return response.data.data;
    }

    async getHandover(id: string): Promise<KeyHandover> {
        const response = await api.get(`/key-handovers/${id}`);
        return response.data.data;
    }

    async createHandover(data: {
        busId: string;
        terminalId: string;
        toShiftId: string;
        fromShiftId?: string;
        handoverTime: string;
        notes?: string;
    }): Promise<KeyHandover> {
        const response = await api.post('/key-handovers', data);
        return response.data;
    }

    async confirmFrom(id: string): Promise<KeyHandover> {
        const response = await api.patch(`/key-handovers/${id}/confirm-from`);
        return response.data;
    }

    async confirmTo(id: string): Promise<KeyHandover> {
        const response = await api.patch(`/key-handovers/${id}/confirm-to`);
        return response.data;
    }

    async delete(id: string): Promise<void> {
        const response = await api.delete(`/key-handovers/${id}`);
        return response.data;
    }
}

export const keyHandoverService = new KeyHandoverService();
