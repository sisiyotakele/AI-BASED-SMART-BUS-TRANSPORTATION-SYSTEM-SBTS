import { z } from 'zod';

export const createAssignmentSchema = z.object({
  busId: z.string().uuid(),
  shiftId: z.string().uuid(),
  assignedDate: z.coerce.date(),
  status: z.enum(['active', 'cancelled']).default('active'),
});

export const createAssignmentWithShiftSchema = z.object({
  driverId: z.string().uuid(),
  busId: z.string().uuid(),
  assignedDate: z.coerce.date(),
  shiftStart: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid start time format (HH:MM)'),
  shiftEnd: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid end time format (HH:MM)'),
  shiftName: z.string().optional(),
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
