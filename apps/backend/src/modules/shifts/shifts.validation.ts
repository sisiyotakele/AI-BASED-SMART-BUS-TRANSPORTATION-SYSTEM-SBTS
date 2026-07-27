import { z } from 'zod';

export const createShiftSchema = z.object({
  driverId: z.string().uuid(),
  shiftName: z.string().min(1).max(255),
  shiftStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  shiftEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  shiftDate: z.coerce.date(),
  isActive: z.boolean().default(true),
});

export const updateShiftSchema = z.object({
  driverId: z.string().uuid().optional(),
  shiftName: z.string().min(1).max(255).optional(),
  shiftStart: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  shiftEnd: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).optional(),
  shiftDate: z.coerce.date().optional(),
  isActive: z.boolean().optional(),
}).refine(d => Object.keys(d).length > 0, 'At least one field required');

export const shiftIdParamSchema = z.object({ id: z.string().uuid() });
export const listShiftsQuerySchema = z.object({
  driverId: z.string().uuid().optional(),
  date: z.coerce.date().optional(),
});
