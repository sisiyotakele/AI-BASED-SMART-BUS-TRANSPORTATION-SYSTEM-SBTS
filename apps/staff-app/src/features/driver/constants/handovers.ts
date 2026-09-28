// src/features/driver/constants/handovers.ts

export const VEHICLE_CONDITIONS = [
  "Good",
  "Fair",
  "Needs Attention",
  "Needs Maintenance",
] as const;

export const HANDOVER_STATUSES = {
  Pending: "Pending",
  Accepted: "Accepted",
  Completed: "Completed",
  Rejected: "Rejected",
} as const;