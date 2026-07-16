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
  data: T,
  message: string = 'Success',
  meta?: ApiResponse<T>['meta']
): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
    meta,
  };
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
