import { Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
  error?: {
    code: string;
    details?: Record<string, unknown>;
  };
}

export function successResponse<T>(
  res: Response,
  data: T,
  message: string = 'Success',
  statusCode: number = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function errorResponse(
  message: string,
  code: string = 'INTERNAL_ERROR',
  details?: Record<string, unknown>
): ApiResponse<never> {
  return {
    success: false,
    message,
    error: {
      code,
      details,
    },
  };
}
