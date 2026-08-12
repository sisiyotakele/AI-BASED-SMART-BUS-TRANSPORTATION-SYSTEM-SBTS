import api from '../lib/api';

export interface BusRouteAssignment {
    id: string;
    busId: string;
    routeId: string;
    versionId: string;
    assignedDate: string;
    endDate?: string | null;
    isActive: boolean;
    bus?: {
        plateNumber: string;
    };
    route?: {
        routeName: string;
    };
}

class BusRouteAssignmentService {
    async getAssignments(params?: { busId?: string; routeId?: string; isActive?: boolean }): Promise<BusRouteAssignment[]> {
        const response = await api.get('/bus-route-assignments', { params });
        return response.data.data;
    }

    async getAssignment(id: string): Promise<BusRouteAssignment> {
        const response = await api.get(`/bus-route-assignments/${id}`);
        return response.data.data;
    }

    async createAssignment(data: {
        busId: string;
        routeId: string;
        versionId?: string;
        assignedDate: string;
        endDate?: string;
    }): Promise<BusRouteAssignment> {
        const response = await api.post('/bus-route-assignments', data);
        return response.data;
    }

    async updateAssignment(id: string, data: Partial<BusRouteAssignment>): Promise<BusRouteAssignment> {
        const response = await api.patch(`/bus-route-assignments/${id}`, data);
        return response.data;
    }

    async deactivateAssignment(id: string, data?: { endDate?: string }): Promise<BusRouteAssignment> {
        const response = await api.patch(`/bus-route-assignments/${id}/deactivate`, data || {});
        return response.data;
    }

    async deleteAssignment(id: string): Promise<void> {
        await api.delete(`/bus-route-assignments/${id}`);
    }
}

export const busRouteAssignmentService = new BusRouteAssignmentService();
