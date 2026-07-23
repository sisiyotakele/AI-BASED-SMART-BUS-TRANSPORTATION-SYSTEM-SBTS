import { z } from 'zod';

export const createAssignmentSchema = z.object({
  busId: z.string().uuid(),
  shiftId: z.string().uuid(),
  assignedDate: z.coerce.date(),
  status: z.enum(['active', 'cancelled']).default('active'),
});

export const updateAssignmentSchema = z.object({
  status: z.enum(['active', 'cancelled']).optional(),
}).refine(d => Object.keys(d).length > 0, 'At least one field required');

export const assignmentIdParamSchema = z.object({ id: z.string().uuid() });
export const assignmentQuerySchema = z.object({
  date: z.coerce.date().optional(),
  busId: z.string().uuid().optional(),
  shiftId: z.string().uuid().optional(),
});
