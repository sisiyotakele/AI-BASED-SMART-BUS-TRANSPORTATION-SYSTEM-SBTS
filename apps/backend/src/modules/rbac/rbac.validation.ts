import { z } from 'zod';

export const createRoleSchema = z.object({
  roleName: z.string().min(1, 'Role name is required').max(255, 'Role name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
});

export const updateRoleSchema = z.object({
  roleName: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
}).refine(
  (data) => data.roleName !== undefined || data.description !== undefined,
  { message: 'At least one field must be provided for update' }
);

export const roleIdParamSchema = z.object({
  id: z.string().uuid('Invalid role ID format'),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid('Invalid user ID format'),
});

export const assignPermissionSchema = z.object({
  permissionId: z.string().uuid('Invalid permission ID format'),
});

export const assignRoleSchema = z.object({
  roleId: z.string().uuid('Invalid role ID format'),
});

export const listPermissionsQuerySchema = z.object({
  resource: z.string().optional(),
  action: z.string().optional(),
  search: z.string().optional(),
});

export const listRolesQuerySchema = z.object({
  search: z.string().optional(),
  includePermissions: z.enum(['true', 'false']).optional().default('false'),
});
