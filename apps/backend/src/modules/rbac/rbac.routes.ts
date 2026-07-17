import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import {
  createRoleSchema,
  updateRoleSchema,
  roleIdParamSchema,
  userIdParamSchema,
  assignPermissionSchema,
  assignRoleSchema,
  listPermissionsQuerySchema,
  listRolesQuerySchema,
} from './rbac.validation';
import {
  createRole,
  listRoles,
  getRoleById,
  updateRole,
  deleteRole,
  listPermissions,
  assignPermissionToRole,
  removePermissionFromRole,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
} from './rbac.controller';
import { requirePermission } from './rbac.middleware';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

// ============================================================
// ROLES
// ============================================================

router.post(
  '/roles',
  requirePermission('roles:create'),
  validateBody(createRoleSchema),
  createRole
);

router.get(
  '/roles',
  requirePermission('roles:read'),
  validateQuery(listRolesQuerySchema),
  listRoles
);

router.get(
  '/roles/:id',
  requirePermission('roles:read'),
  validateParams(roleIdParamSchema),
  getRoleById
);

router.patch(
  '/roles/:id',
  requirePermission('roles:update'),
  validateParams(roleIdParamSchema),
  validateBody(updateRoleSchema),
  updateRole
);

router.delete(
  '/roles/:id',
  requirePermission('roles:delete'),
  validateParams(roleIdParamSchema),
  deleteRole
);

// ============================================================
// PERMISSIONS
// ============================================================

router.get(
  '/permissions',
  requirePermission('roles:read'),
  validateQuery(listPermissionsQuerySchema),
  listPermissions
);

// ============================================================
// ROLE-PERMISSION ASSIGNMENTS
// ============================================================

router.post(
  '/roles/:id/permissions',
  requirePermission('roles:update'),
  validateParams(roleIdParamSchema),
  validateBody(assignPermissionSchema),
  assignPermissionToRole
);

router.delete(
  '/roles/:id/permissions/:permissionId',
  requirePermission('roles:update'),
  validateParams(roleIdParamSchema),
  removePermissionFromRole
);

// ============================================================
// USER-ROLE ASSIGNMENTS
// ============================================================

router.post(
  '/users/:id/roles',
  requirePermission('users:update'),
  validateParams(userIdParamSchema),
  validateBody(assignRoleSchema),
  assignRoleToUser
);

router.delete(
  '/users/:id/roles/:roleId',
  requirePermission('users:update'),
  validateParams(userIdParamSchema),
  removeRoleFromUser
);

router.get(
  '/users/:id/roles',
  requirePermission('roles:read'),
  validateParams(userIdParamSchema),
  getUserRoles
);

export default router;