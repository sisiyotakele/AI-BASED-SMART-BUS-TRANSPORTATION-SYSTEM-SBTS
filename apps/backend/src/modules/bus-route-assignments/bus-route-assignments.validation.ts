import { z } from 'zod';

export const createAssignmentSchema = z.object({
  busId: z.string().uuid(),
  routeId: z.string().uuid(),
  assignedDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
});

export const deactivateSchema = z.object({
  endDate: z.coerce.date().optional(),
});

export const assignmentIdParamSchema = z.object({ id: z.string().uuid() });
export const assignmentQuerySchema = z.object({
  busId: z.string().uuid().optional(),
});
