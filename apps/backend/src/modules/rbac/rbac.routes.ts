import { Router } from 'express';
import { rbacController } from './rbac.controller';
import { authenticate } from '../../middlewares/auth.middleware';
import { requirePermission, requireRole } from './rbac.middleware';

const router = Router();

// All RBAC routes require authentication
router.use(authenticate);

// Public within auth: list roles, permissions for any authenticated user? Per spec admin-only. We'll enforce.

/**
 * Roles CRUD - admin-only
 * GET /roles
 * POST /roles
 * PATCH /roles/:id
 * DELETE /roles/:id
 * GET /roles/:id
 */
router.get('/roles', requirePermission('manage_roles'), rbacController.listRoles.bind(rbacController));
router.get('/roles/:id', requirePermission('manage_roles'), rbacController.getRole.bind(rbacController));
router.post('/roles', requirePermission('manage_roles'), rbacController.createRole.bind(rbacController));
router.patch('/roles/:id', requirePermission('manage_roles'), rbacController.updateRole.bind(rbacController));
router.delete('/roles/:id', requirePermission('manage_roles'), rbacController.deleteRole.bind(rbacController));

/**
 * Role-Permissions
 * GET /roles/:id/permissions
 * POST /roles/:id/permissions - attach
 * DELETE /roles/:id/permissions/:permission_id
 */
router.get('/roles/:id/permissions', requirePermission('manage_roles'), rbacController.getRolePermissions.bind(rbacController));
router.post('/roles/:id/permissions', requirePermission('manage_roles'), rbacController.attachPermission.bind(rbacController));
router.delete('/roles/:id/permissions/:permission_id', requirePermission('manage_roles'), rbacController.detachPermission.bind(rbacController));

/**
 * Permissions - admin-only, mostly seeded
 * GET /permissions
 * POST /permissions
 */
router.get('/permissions', requirePermission('manage_permissions'), rbacController.listPermissions.bind(rbacController));
router.post('/permissions', requirePermission('manage_permissions'), rbacController.createPermission.bind(rbacController));

/**
 * User-Roles assignment - admin-only
 * POST /users/:id/roles
 * DELETE /users/:id/roles/:role_id
 * GET /users/:id/roles
 */
router.get('/users/:id/roles', requirePermission('manage_roles'), rbacController.getUserRoles.bind(rbacController));
router.post('/users/:id/roles', requirePermission('manage_roles'), rbacController.assignRoleToUser.bind(rbacController));
router.delete('/users/:id/roles/:role_id', requirePermission('manage_roles'), rbacController.removeRoleFromUser.bind(rbacController));

/**
 * Self - any authenticated user can view their own roles/permissions
 * GET /me/roles
 */
router.get('/me/roles', rbacController.getMyRoles.bind(rbacController));

export default router;
