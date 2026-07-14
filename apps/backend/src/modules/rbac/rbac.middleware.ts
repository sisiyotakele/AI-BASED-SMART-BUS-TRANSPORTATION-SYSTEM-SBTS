import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middlewares/auth.middleware';
import { ForbiddenError, UnauthorizedError } from '../../utils/errors';
import { rbacService } from './rbac.service';
import { logger } from '../../utils/logger';

/**
 * requirePermission - checks if authenticated user has required permission
 * 
 * Per spec:
 * JWT must encode enough role/permission context that RBAC middleware doesn't need a DB hit on every request (cache roles in token, refresh on role change).
 * 
 * Implementation:
 * 1. First checks permissions array in JWT payload (fast path, no DB hit)
 * 2. If not found in token, falls back to DB lookup (for cases where token is old or permissions changed)
 * 3. Admin role bypass? No, we enforce explicit permission but admin seed gets all perms. Optionally check admin wildcard.
 * 
 * Usage:
 * requirePermission("create_trip")
 * requirePermission("manage_fleet")
 * requirePermission("resolve_incident")
 */
export const requirePermission = (permission_name: string, options?: { allowAdminBypass?: boolean }) => {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const permissions = req.user.permissions || [];
      const roles = req.user.roles || [];

      // Fast path - check token payload
      if (permissions.includes(permission_name)) {
        logger.debug(`Permission ${permission_name} granted via token for user ${req.user.id}`);
        return next();
      }

      // Admin bypass if enabled - admin role implicit all perms
      if (options?.allowAdminBypass && roles.includes('admin')) {
        logger.debug(`Permission ${permission_name} granted via admin bypass for user ${req.user.id}`);
        return next();
      }

      // Slow path - DB lookup to handle role changes after token issuance
      const hasPermissionInDb = await rbacService.hasPermission(req.user.id, permission_name);
      if (hasPermissionInDb) {
        logger.debug(`Permission ${permission_name} granted via DB for user ${req.user.id}`);
        return next();
      }

      // Check if user is admin and has wildcard - additional safety
      if (roles.includes('admin')) {
        // Even admin must have permission unless allowAdminBypass, but we check if permission exists at all
        // Log for audit
        logger.warn(`Admin user ${req.user.id} denied permission ${permission_name} - not in seed?`);
      }

      throw new ForbiddenError(`Missing required permission: ${permission_name}`);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * requireRole - checks if user has one of the required roles
 */
export const requireRole = (...role_names: string[]) => {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const userRoles = req.user.roles || [];

      // Fast path
      const hasRole = role_names.some((r) => userRoles.includes(r));
      if (hasRole) {
        return next();
      }

      // DB fallback
      const dbRoles = await rbacService.getUserRolesNames(req.user.id);
      const hasRoleInDb = role_names.some((r) => dbRoles.includes(r));
      if (hasRoleInDb) {
        return next();
      }

      throw new ForbiddenError(`Requires one of roles: ${role_names.join(', ')}`);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * requireAnyPermission - user needs at least one of the listed permissions
 */
export const requireAnyPermission = (...permission_names: string[]) => {
  return async (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const permissions = req.user.permissions || [];

      if (permission_names.some((p) => permissions.includes(p))) {
        return next();
      }

      const userPermissions = await rbacService.getUserPermissions(req.user.id);
      if (permission_names.some((p) => userPermissions.includes(p))) {
        return next();
      }

      throw new ForbiddenError(`Requires one of permissions: ${permission_names.join(', ')}`);
    } catch (error) {
      next(error);
    }
  };
};
