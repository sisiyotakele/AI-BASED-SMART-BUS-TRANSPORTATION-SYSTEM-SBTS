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

/**
 * @swagger
 * /api/v1/rbac/roles:
 *   post:
 *     summary: Create a new role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleName
 *             properties:
 *               roleName:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Missing permission
 *       409:
 *         description: Role already exists
 *       500:
 *         description: Server error
 */
router.post(
  '/roles',
  requirePermission('roles:create'),
  validateBody(createRoleSchema),
  createRole
);

/**
 * @swagger
 * /api/v1/rbac/roles:
 *   get:
 *     summary: List all roles
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by role name
 *     responses:
 *       200:
 *         description: List of roles
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get(
  '/roles',
  requirePermission('roles:read'),
  validateQuery(listRolesQuerySchema),
  listRoles
);

/**
 * @swagger
 * /api/v1/rbac/roles/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */
router.get(
  '/roles/:id',
  requirePermission('roles:read'),
  validateParams(roleIdParamSchema),
  getRoleById
);

/**
 * @swagger
 * /api/v1/rbac/roles/{id}:
 *   patch:
 *     summary: Update role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/roles/:id',
  requirePermission('roles:update'),
  validateParams(roleIdParamSchema),
  validateBody(updateRoleSchema),
  updateRole
);

/**
 * @swagger
 * /api/v1/rbac/roles/{id}:
 *   delete:
 *     summary: Delete role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role not found
 *       409:
 *         description: Cannot delete role with active users
 *       500:
 *         description: Server error
 */
router.delete(
  '/roles/:id',
  requirePermission('roles:delete'),
  validateParams(roleIdParamSchema),
  deleteRole
);

// ============================================================
// PERMISSIONS
// ============================================================

/**
 * @swagger
 * /api/v1/rbac/permissions:
 *   get:
 *     summary: List all permissions
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: resource
 *         schema:
 *           type: string
 *         description: Filter by resource
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action
 *     responses:
 *       200:
 *         description: List of permissions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get(
  '/permissions',
  requirePermission('roles:read'),
  validateQuery(listPermissionsQuerySchema),
  listPermissions
);

// ============================================================
// ROLE-PERMISSION ASSIGNMENTS
// ============================================================

/**
 * @swagger
 * /api/v1/rbac/roles/{id}/permissions:
 *   post:
 *     summary: Assign permission to role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Role ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissionId
 *             properties:
 *               permissionId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Permission assigned successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role or permission not found
 *       409:
 *         description: Permission already assigned
 *       500:
 *         description: Server error
 */
router.post(
  '/roles/:id/permissions',
  requirePermission('roles:update'),
  validateParams(roleIdParamSchema),
  validateBody(assignPermissionSchema),
  assignPermissionToRole
);

/**
 * @swagger
 * /api/v1/rbac/roles/{id}/permissions/{permissionId}:
 *   delete:
 *     summary: Remove permission from role
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Role ID
 *       - in: path
 *         name: permissionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Permission ID
 *     responses:
 *       200:
 *         description: Permission removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Role or permission not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/roles/:id/permissions/:permissionId',
  requirePermission('roles:update'),
  validateParams(roleIdParamSchema),
  removePermissionFromRole
);

// ============================================================
// USER-ROLE ASSIGNMENTS
// ============================================================

/**
 * @swagger
 * /api/v1/rbac/users/{id}/roles:
 *   post:
 *     summary: Assign role to user
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - roleId
 *             properties:
 *               roleId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User or role not found
 *       409:
 *         description: Role already assigned
 *       500:
 *         description: Server error
 */
router.post(
  '/users/:id/roles',
  requirePermission('users:update'),
  validateParams(userIdParamSchema),
  validateBody(assignRoleSchema),
  assignRoleToUser
);

/**
 * @swagger
 * /api/v1/rbac/users/{id}/roles/{roleId}:
 *   delete:
 *     summary: Remove role from user
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Role ID
 *     responses:
 *       200:
 *         description: Role removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User or role not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/users/:id/roles/:roleId',
  requirePermission('users:update'),
  validateParams(userIdParamSchema),
  removeRoleFromUser
);

/**
 * @swagger
 * /api/v1/rbac/users/{id}/roles:
 *   get:
 *     summary: Get user roles
 *     tags: [RBAC]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User ID
 *     responses:
 *       200:
 *         description: User roles with permissions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get(
  '/users/:id/roles',
  requirePermission('roles:read'),
  validateParams(userIdParamSchema),
  getUserRoles
);

export default router;