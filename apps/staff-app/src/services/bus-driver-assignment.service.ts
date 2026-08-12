import api from '../lib/api';

export interface BusDriverAssignment {
    id: string;
    busId: string;
    shiftId: string;
    assignedDate: string;
    status: 'active' | 'cancelled';
    bus?: {
        id: string;
        plateNumber: string;
    };
    shift?: {
        id: string;
        shiftName: string;
        shiftStart: string | Date;
        shiftEnd: string | Date;
        driver?: {
            id: string;
            fullName: string;
        };
    };
}

class BusDriverAssignmentService {
    async getAssignments(params?: {
        busId?: string;
        driverId?: string;
        shiftId?: string;
        assignedDate?: string;
    }): Promise<BusDriverAssignment[]> {
        const response = await api.get('/bus-driver-assignments', { params });
        return response.data.data;
    }

    async getAssignment(id: string): Promise<BusDriverAssignment> {
        const response = await api.get(`/bus-driver-assignments/${id}`);
        return response.data.data;
    }

    async createAssignment(data: {
        busId: string;
        shiftId: string;
        assignedDate: string;
    }): Promise<BusDriverAssignment> {
        const response = await api.post('/bus-driver-assignments', data);
        return response.data;
    }

    async updateAssignment(id: string, data: { shiftId?: string; assignedDate?: string }): Promise<BusDriverAssignment> {
        const response = await api.patch(`/bus-driver-assignments/${id}`, data);
        return response.data;
    }

    async deleteAssignment(id: string): Promise<void> {
        await api.delete(`/bus-driver-assignments/${id}`);
    }
}

export const busDriverAssignmentService = new BusDriverAssignmentService();
