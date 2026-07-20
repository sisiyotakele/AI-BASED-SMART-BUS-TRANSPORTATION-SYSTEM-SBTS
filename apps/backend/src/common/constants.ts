/**
 * Shared constants and Prisma query patterns to eliminate duplication
 */

/**
 * Standard include pattern for fetching user with roles and permissions.
 * Used in auth.service.ts, rbac.service.ts, and testAuth.ts
 */
export const USER_WITH_ROLES_INCLUDE = {
    userRoles: {
        include: {
            role: {
                include: {
                    rolePermissions: {
                        include: {
                            permission: {
                                select: {
                                    permissionName: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    },
} as const;

/**
 * Simple include for user with basic role info (no permissions)
 */
export const USER_WITH_BASIC_ROLES_INCLUDE = {
    userRoles: {
        include: {
            role: {
                select: {
                    id: true,
                    roleName: true,
                    description: true,
                },
            },
        },
    },
} as const;

/**
 * Standard pagination defaults
 */
export const PAGINATION_DEFAULTS = {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
} as const;

/**
 * Common response messages
 */
export const MESSAGES = {
    // Auth
    REGISTRATION_SUCCESS: 'Registration successful',
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    TOKEN_REFRESHED: 'Token refreshed',

    // CRUD
    CREATED_SUCCESS: 'Resource created successfully',
    UPDATED_SUCCESS: 'Resource updated successfully',
    DELETED_SUCCESS: 'Resource deleted successfully',
    RETRIEVED_SUCCESS: 'Resource retrieved successfully',

    // Errors
    NOT_FOUND: 'Resource not found',
    UNAUTHORIZED: 'Authentication required',
    FORBIDDEN: 'Access denied',
    VALIDATION_ERROR: 'Validation failed',
} as const;
