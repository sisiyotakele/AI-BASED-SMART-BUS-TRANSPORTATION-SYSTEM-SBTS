// src/features/driver/types/maintenance.types.ts

export interface MaintenanceRequest {
  id: number;
  type: string;
  description: string;
  priority: string;
  date: string;
  status: string;
  vehicle: string;
}