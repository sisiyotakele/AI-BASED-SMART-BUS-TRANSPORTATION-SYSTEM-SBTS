// src/modules/reporting/reporting.validation.ts

import { z } from 'zod';

// ─── Filter Schema ──────────────────────────────────────────────

export const reportFilterSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  routeId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  busId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type ReportFilterDto = z.infer<typeof reportFilterSchema>;

// ─── Response Schemas (for type safety) ─────────────────────────

export interface DashboardStats {
  users: number;
  buses: number;
  routes: number;
  trips: number;
  schedules: number;
  incidents: number;
  notifications: number;
}

export interface TripReportItem {
  id: string;
  status: string;
  scheduledStart: Date;
  actualStart: Date | null;
  actualEnd: Date | null;
  createdAt: Date;
  bus: {
    id: string;
    plateNumber: string;
    model: string;
  };
  driver: {
    id: string;
    fullName: string;
    email: string;
  };
  routeName: string;
}

export interface IncidentReportItem {
  id: string;
  incidentType: string;
  severity: string;
  status: string;
  description: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
  busPlate: string | null;
  driverName: string | null;
}

export interface BusReportItem {
  id: string;
  plateNumber: string;
  model: string;
  capacity: number;
  maintenanceStatus: string;
  totalTrips: number;
}

export interface DriverReportItem {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  totalTrips: number;
  activeTrips: number;
  completedTrips: number;
}

export interface RevenueReport {
  totalRevenue: number;
  totalTrips: number;
  averageRevenue: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}