import api from '../lib/api';

export interface ReportStats {
    totalEntities: number;
    completed: number;
    [key: string]: any;
}

export interface TripReportResponse {
    trips: any[];
    stats: any;
}

export interface IncidentReportResponse {
    incidents: any[];
    stats: any;
}

export interface FleetReportResponse {
    buses: any[];
    stats: any;
}

export interface ReportHistoryItem {
    id: string;
    reportName: string;
    reportType: string;
    description: string | null;
    status: string;
    createdAt: string;
    creator?: {
        fullName: string;
    };
    downloads?: any[];
}

class ReportService {
    async getTripReport(params?: { startDate?: string; endDate?: string }): Promise<TripReportResponse> {
        const response = await api.get('/reports/trips', { params });
        return response.data.data;
    }

    async getIncidentReport(params?: { startDate?: string; endDate?: string; severity?: string }): Promise<IncidentReportResponse> {
        const response = await api.get('/reports/incidents', { params });
        return response.data.data;
    }

    async getFleetReport(): Promise<FleetReportResponse> {
        const response = await api.get('/reports/fleet');
        return response.data.data;
    }

    async getReportHistory(params?: { limit?: number; offset?: number }): Promise<{ reports: ReportHistoryItem[]; total: number }> {
        const response = await api.get('/reports/history', { params });
        return response.data.data;
    }

    async getReportStats(): Promise<any> {
        const response = await api.get('/reports/stats');
        return response.data.data;
    }

    async createReport(data: any): Promise<any> {
        const response = await api.post('/reports/history', data);
        return response.data;
    }
}

export const reportService = new ReportService();
