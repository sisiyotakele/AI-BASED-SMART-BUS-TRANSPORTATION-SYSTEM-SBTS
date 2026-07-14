import { z } from 'zod';

export const createRoleSchema = z.object({
  role_name: z.string().min(2).max(50).trim().toLowerCase().regex(/^[a-z0-9_-]+$/, 'role_name must be lowercase alphanumeric with _-'),
  description: z.string().max(255).optional(),
});

export const updateRoleSchema = z.object({
  role_name: z.string().min(2).max(50).trim().toLowerCase().regex(/^[a-z0-9_-]+$/).optional(),
  description: z.string().max(255).optional(),
});

export const createPermissionSchema = z.object({
  permission_name: z.string().min(2).max(100).trim(),
  resource: z.string().min(2).max(50).trim(),
  action: z.string().min(2).max(50).trim(),
  description: z.string().max(500).optional(),
});

export const attachPermissionSchema = z.object({
  permission_id: z.string().uuid(),
});

export const attachPermissionsBulkSchema = z.object({
  permission_ids: z.array(z.string().uuid()).min(1),
});

export const assignRoleSchema = z.object({
  role_id: z.string().uuid(),
});

export const assignRolesBulkSchema = z.object({
  role_ids: z.array(z.string().uuid()).min(1),
});

export type CreateRoleDto = z.infer<typeof createRoleSchema>;
export type UpdateRoleDto = z.infer<typeof updateRoleSchema>;
export type CreatePermissionDto = z.infer<typeof createPermissionSchema>;
