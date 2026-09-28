// src/features/driver/constants/colors.ts

export const COLORS = {
  primary: '#12B2E4',
  primaryHover: '#0e9ed4',
  secondary: '#2B4B9E',
  secondaryHover: '#1f3a7a',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
} as const;

export const STATUS_COLORS = {
  reported: '#12B2E4',
  inProgress: '#2B4B9E',
  resolved: '#22c55e',
  pending: '#12B2E4',
  completed: '#22c55e',
  rejected: '#ef4444',
} as const;