import { z } from 'zod';

// Audit logs are typically read-only, so we mainly validate query parameters

export const auditLogIdParamSchema = z.object({
    id: z.string().uuid()
});

export const auditLogUserIdParamSchema = z.object({
    userId: z.string().uuid()
});

export const auditLogEntityParamSchema = z.object({
    entityName: z.string().min(1)
});

export const auditLogSearchQuerySchema = z.object({
    userId: z.string().uuid().optional(),
    action: z.string().optional(),
    entityName: z.string().optional(),
    entityId: z.string().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional()
});

export const auditLogEntityQuerySchema = z.object({
    entityId: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional()
});
