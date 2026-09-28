import api from '../lib/api';

export interface BusRouteAssignment {
    id: string;
    busId: string;
    routeId: string;
    versionId?: string;
    scheduleId?: string;
    assignedDate: string;
    endDate?: string | null;
    isActive: boolean;
    bus?: { id: string; plateNumber: string };
    route?: { id: string; routeName: string };
    schedule?: { id: string; scheduleName: string; departureTime: string; dayOfWeek: string };
}

export interface ScheduleAvailability {
    scheduleId: string;
    isAssigned: boolean;
    assignedBus: { id: string; plateNumber: string; model: string; capacity: number; maintenanceStatus: string } | null;
    availableBuses: { id: string; plateNumber: string; model: string; capacity: number; maintenanceStatus: string; terminal?: { terminalName: string } }[];
}

class BusRouteAssignmentService {
    async getAssignments(params?: { busId?: string; routeId?: string; scheduleId?: string; isActive?: boolean }): Promise<BusRouteAssignment[]> {
        const response = await api.get('/bus-route-assignments', { params });
        return response.data.data;
    }

    async getAll(params?: { busId?: string; routeId?: string; scheduleId?: string; isActive?: boolean }): Promise<BusRouteAssignment[]> {
        return this.getAssignments(params);
    }

    async getAssignment(id: string): Promise<BusRouteAssignment> {
        const response = await api.get(`/bus-route-assignments/${id}`);
        return response.data.data;
    }

    async createAssignment(data: {
        busId: string;
        routeId: string;
        versionId?: string;
        scheduleId?: string;
        assignedDate: string;
        endDate?: string;
    }): Promise<BusRouteAssignment> {
        const response = await api.post('/bus-route-assignments', data);
        return response.data.data || response.data;
    }

    async updateAssignment(id: string, data: Partial<BusRouteAssignment>): Promise<BusRouteAssignment> {
        const response = await api.patch(`/bus-route-assignments/${id}`, data);
        return response.data.data || response.data;
    }

    async deactivateAssignment(id: string, data?: { endDate?: string }): Promise<BusRouteAssignment> {
        const response = await api.patch(`/bus-route-assignments/${id}/deactivate`, data || {});
        return response.data.data || response.data;
    }

    async deleteAssignment(id: string): Promise<void> {
        await api.delete(`/bus-route-assignments/${id}`);
    }

    /**
     * Check if a schedule already has a bus assigned.
     * Returns whether it's assigned + list of available buses.
     */
    async checkScheduleAvailability(scheduleId: string): Promise<ScheduleAvailability> {
        const response = await api.get('/bus-route-assignments/schedule-check', { params: { scheduleId } });
        return response.data.data;
    }
}

export const busRouteAssignmentService = new BusRouteAssignmentService();
