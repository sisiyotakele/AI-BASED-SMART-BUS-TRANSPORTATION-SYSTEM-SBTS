import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/common/types';
import { successResponse } from '@/common/response';
import { asyncHandler } from '@/common/asyncHandler';
import * as rbacService from './rbac.service';

// ============================================================
// ROLES
// ============================================================

export const createRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const role = await rbacService.createRole(req.body, req.user?.userId);
  return successResponse(res, role, 'Role created successfully', 201);
});

export const listRoles = asyncHandler(async (req: Request, res: Response) => {
  const { search, includePermissions } = req.query as {
    search?: string;
    includePermissions?: string;
  };
  const roles = await rbacService.listRoles({
    search,
    includePermissions: includePermissions === 'true',
  });
  return successResponse(res, roles, 'Roles retrieved successfully');
});

export const getRoleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { includePermissions } = req.query as { includePermissions?: string };
  const role = await rbacService.getRoleById(id, includePermissions === 'true');
  return successResponse(res, role, 'Role retrieved successfully');
});

export const updateRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const role = await rbacService.updateRole(id, req.body);
  return successResponse(res, role, 'Role updated successfully');
});

export const deleteRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  await rbacService.deleteRole(id, req.user?.userId);
  return successResponse(res, null, 'Role deleted successfully');
});

// ============================================================
// PERMISSIONS
// ============================================================

export const listPermissions = asyncHandler(async (req: Request, res: Response) => {
  const { resource, action, search } = req.query as {
    resource?: string;
    action?: string;
    search?: string;
  };
  const permissions = await rbacService.listPermissions({ resource, action, search });
  return successResponse(res, permissions, 'Permissions retrieved successfully');
});

// ============================================================
// ROLE-PERMISSION ASSIGNMENTS
// ============================================================

export const assignPermissionToRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id: roleId } = req.params;
  const assignment = await rbacService.assignPermissionToRole(roleId, req.body, req.user?.userId);
  return successResponse(res, assignment, 'Permission assigned to role successfully', 201);
});

export const removePermissionFromRole = asyncHandler(async (req: Request, res: Response) => {
  const { id: roleId, permissionId } = req.params;
  const result = await rbacService.removePermissionFromRole(roleId, permissionId);
  return successResponse(res, result, 'Permission removed from role successfully');
});

// ============================================================
// USER-ROLE ASSIGNMENTS
// ============================================================

export const assignRoleToUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id: userId } = req.params;
  const assignment = await rbacService.assignRoleToUser(userId, req.body, req.user?.userId);
  return successResponse(res, assignment, 'Role assigned to user successfully', 201);
});

export const removeRoleFromUser = asyncHandler(async (req: Request, res: Response) => {
  const { id: userId, roleId } = req.params;
  const result = await rbacService.removeRoleFromUser(userId, roleId);
  return successResponse(res, result, 'Role removed from user successfully');
});

export const getUserRoles = asyncHandler(async (req: Request, res: Response) => {
  const { id: userId } = req.params;
  const roles = await rbacService.getUserRoles(userId);
  return successResponse(res, roles, 'User roles retrieved successfully');
});
