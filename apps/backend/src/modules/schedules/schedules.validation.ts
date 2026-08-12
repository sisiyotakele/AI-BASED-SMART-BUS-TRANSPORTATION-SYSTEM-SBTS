import { z } from 'zod';

export const createScheduleSchema = z.object({
  routeId: z.string().uuid(),
  versionId: z.string().uuid(),
  scheduleName: z.string().min(1).max(255),
  dayOfWeek: z.string().min(1).max(50),
  departureTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  frequencyMinutes: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().default(true),
  effectiveFrom: z.coerce.date().optional(),
  effectiveUntil: z.coerce.date().optional(),
});

export const updateScheduleSchema = z.object({
  scheduleName: z.string().min(1).max(255).optional(),
  dayOfWeek: z.string().min(1).max(50).optional(),
  departureTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  frequencyMinutes: z.coerce.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  effectiveUntil: z.coerce.date().optional(),
}).refine(d => Object.keys(d).length > 0, 'At least one field required');

export const scheduleIdParamSchema = z.object({ id: z.string().uuid() });
export const scheduleQuerySchema = z.object({
  routeId: z.string().uuid().optional(),
  dayOfWeek: z.string().optional(),
});
