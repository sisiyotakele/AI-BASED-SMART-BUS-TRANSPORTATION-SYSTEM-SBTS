import { z } from 'zod';

export const createAssignmentSchema = z.object({
  busId: z.string().uuid(),
  routeId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  assignedDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
});

export const deactivateSchema = z.object({
  endDate: z.coerce.date().optional(),
});

export const updateAssignmentSchema = z.object({
  busId: z.string().uuid().optional(),
  routeId: z.string().uuid().optional(),
  scheduleId: z.string().uuid().optional(),
  assignedDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const assignmentIdParamSchema = z.object({ id: z.string().uuid() });
export const assignmentQuerySchema = z.object({
  busId: z.string().uuid().optional(),
});
