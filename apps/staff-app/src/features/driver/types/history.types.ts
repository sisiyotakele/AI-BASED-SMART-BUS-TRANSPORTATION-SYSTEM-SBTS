// src/features/driver/types/history.types.ts

export type TabType = "trips" | "incidents" | "maintenance" | "handovers";

export interface FilterState {
  search: string;
  status: string;
  route: string;
  startDate: string;
  endDate: string;
}

export interface PaginationState {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
}