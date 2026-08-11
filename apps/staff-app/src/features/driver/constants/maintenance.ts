// src/features/driver/constants/maintenance.ts

export const MAINTENANCE_TYPES: string[] = [
  "Oil Change",
  "Tire Replacement",
  "Brake Service",
  "Engine Check",
  "Electrical Issue",
  "Other",
];

export const MAINTENANCE_PRIORITIES = ["low", "medium", "high", "urgent"] as const;