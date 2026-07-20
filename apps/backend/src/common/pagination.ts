import { PAGINATION_DEFAULTS } from './constants';

/**
 * Pagination utility types and functions
 */

export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: PaginationMeta;
}

/**
 * Parse and validate pagination parameters from query
 */
export function parsePaginationParams(params: PaginationParams): {
    page: number;
    limit: number;
    skip: number;
    take: number;
} {
    const page = Math.max(1, Number(params.page) || PAGINATION_DEFAULTS.DEFAULT_PAGE);
    const limit = Math.min(
        Math.max(1, Number(params.limit) || PAGINATION_DEFAULTS.DEFAULT_LIMIT),
        PAGINATION_DEFAULTS.MAX_LIMIT
    );

    const skip = (page - 1) * limit;
    const take = limit;

    return { page, limit, skip, take };
}

/**
 * Build pagination metadata
 */
export function buildPaginationMeta(
    page: number,
    limit: number,
    total: number
): PaginationMeta {
    const totalPages = Math.ceil(total / limit);

    return {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrevious: page > 1,
    };
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
    data: T[],
    page: number,
    limit: number,
    total: number
): PaginatedResponse<T> {
    return {
        data,
        meta: buildPaginationMeta(page, limit, total),
    };
}

/**
 * Execute a paginated Prisma query with count
 * 
 * @example
 * const result = await executePaginatedQuery(
 *   { page: 1, limit: 10 },
 *   () => prisma.user.findMany({ where, skip, take }),
 *   () => prisma.user.count({ where })
 * );
 */
export async function executePaginatedQuery<T>(
    params: PaginationParams,
    queryFn: (pagination: { skip: number; take: number }) => Promise<T[]>,
    countFn: () => Promise<number>
): Promise<PaginatedResponse<T>> {
    const { page, limit, skip, take } = parsePaginationParams(params);

    // Execute query and count in parallel
    const [data, total] = await Promise.all([
        queryFn({ skip, take }),
        countFn(),
    ]);

    return createPaginatedResponse(data, page, limit, total);
}
