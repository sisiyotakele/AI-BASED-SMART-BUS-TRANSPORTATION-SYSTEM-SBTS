import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/common/types';
import { ForbiddenError, UnauthorizedError } from '@/common/errors';
import { userHasPermission } from './rbac.service';

/**
 * Middleware factory that checks if the authenticated user has a specific permission.
 * Must be used AFTER an authentication middleware that populates req.user.
 */
export function requirePermission(permissionName: string) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('Authentication required'));
      }

      // Safe fallback for legacy tokens without roles
      const roles = req.user.roles ?? [];

      // Fast path: if permissions are already cached in the token payload
      const hasPermissionFromToken = roles.some((role) =>
        role.permissions.includes(permissionName)
      );

      if (hasPermissionFromToken) {
        return next();
      }

      // Fallback: check database (useful if permissions changed since token issuance)
      const hasPermission = await userHasPermission(req.user.userId, permissionName);
      if (!hasPermission) {
        return next(
          new ForbiddenError(
            `Access denied: required permission '${permissionName}'`,
            'MISSING_PERMISSION'
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware factory that checks if the authenticated user has ANY of the specified permissions.
 * OPTIMIZED: Fetches all user permissions in a single query instead of N separate queries.
 */
export function requireAnyPermission(...permissionNames: string[]) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('Authentication required'));
      }

      // Safe fallback for legacy tokens without roles
      const roles = req.user.roles ?? [];

      // Fast path: check token first (no DB query)
      const tokenPerms = new Set(
        roles.flatMap((r) => r.permissions)
      );
      const hasAnyFromToken = permissionNames.some((p) => tokenPerms.has(p));
      if (hasAnyFromToken) {
        return next();
      }

      // Fallback: fetch ALL user permissions in a SINGLE query
      const { getUserPermissions } = await import('./rbac.service');
      const allUserPermissions = await getUserPermissions(req.user.userId);
      const userPermsSet = new Set(allUserPermissions);

      const hasAnyPermission = permissionNames.some((p) => userPermsSet.has(p));

      if (hasAnyPermission) {
        return next();
      }

      return next(
        new ForbiddenError(
          `Access denied: requires any of [${permissionNames.join(', ')}]`,
          'MISSING_PERMISSION'
        )
      );
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware factory that checks if the authenticated user has ALL of the specified permissions.
 * OPTIMIZED: Fetches all user permissions in a single query instead of N separate queries.
 */
export function requireAllPermissions(...permissionNames: string[]) {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError('Authentication required'));
      }

      // Safe fallback for legacy tokens without roles
      const roles = req.user.roles ?? [];

      // Fast path: check token first (no DB query)
      const tokenPerms = new Set(
        roles.flatMap((r) => r.permissions)
      );
      const missingFromToken = permissionNames.filter((p) => !tokenPerms.has(p));

      if (missingFromToken.length === 0) {
        return next(); // All permissions found in token
      }

      // Fallback: fetch ALL user permissions in a SINGLE query
      const { getUserPermissions } = await import('./rbac.service');
      const allUserPermissions = await getUserPermissions(req.user.userId);
      const userPermsSet = new Set(allUserPermissions);

      const stillMissing = missingFromToken.filter((p) => !userPermsSet.has(p));

      if (stillMissing.length === 0) {
        return next(); // All permissions found in DB
      }

      return next(
        new ForbiddenError(
          `Access denied: missing permissions [${stillMissing.join(', ')}]`,
          'MISSING_PERMISSION'
        )
      );
    } catch (error) {
      next(error);
    }
  };
}