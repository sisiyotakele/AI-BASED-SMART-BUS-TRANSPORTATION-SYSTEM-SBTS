// src/features/driver/types/incident.types.ts

export interface IncidentReport {
  id: number;
  type: string;
  description: string;
  time: string;
  location: string;
  status: "Reported" | "In Progress" | "Resolved";
}