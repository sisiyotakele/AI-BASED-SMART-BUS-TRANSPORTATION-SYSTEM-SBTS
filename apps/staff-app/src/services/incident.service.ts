import api from '@/lib/api';
import { ApiResponse, Incident } from '@/types';

class IncidentService {
    async getAll(status?: string, severity?: string) {
        const query = new URLSearchParams();
        if (status && status !== 'All') query.append('status', status.toLowerCase());
        if (severity && severity !== 'All') query.append('severity', severity.toLowerCase());

        const response = await api.get<ApiResponse<Incident[]>>(`/incidents?${query.toString()}`);
        return response.data.data;
    }

    async getById(id: string) {
        const response = await api.get<ApiResponse<Incident>>(`/incidents/${id}`);
        return response.data.data;
    }

    async create(data: Partial<Incident>) {
        const response = await api.post<ApiResponse<Incident>>('/incidents', data);
        return response.data.data;
    }

    async review(id: string) {
        const response = await api.patch<ApiResponse<Incident>>(`/incidents/${id}/review`);
        return response.data.data;
    }

    async resolve(id: string, resolutionNotes: string) {
        const response = await api.patch<ApiResponse<Incident>>(`/incidents/${id}/resolve`, { resolutionNotes });
        return response.data.data;
    }

    async delete(id: string) {
        const response = await api.delete<ApiResponse<null>>(`/incidents/${id}`);
        return response.data;
    }
}

export const incidentService = new IncidentService();
