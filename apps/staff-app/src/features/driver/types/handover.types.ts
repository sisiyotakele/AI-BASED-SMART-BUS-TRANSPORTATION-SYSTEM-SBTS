// src/features/driver/types/handover.types.ts

export type HandoverStatus = "Pending" | "Accepted" | "Completed" | "Rejected";

export interface ShiftHandover {
  id: string | number;   // backend returns UUID strings
  currentDriver: string;
  nextDriver: string;
  vehicleCondition: string;
  notes: string;
  date: string;
  status: HandoverStatus | string;
  initiatedBy: string;
  initiatedTime: string;
  acceptedTime?: string;
  completedTime?: string;
  currentDriverLocation?: string;
  nextDriverLocation?: string;
}