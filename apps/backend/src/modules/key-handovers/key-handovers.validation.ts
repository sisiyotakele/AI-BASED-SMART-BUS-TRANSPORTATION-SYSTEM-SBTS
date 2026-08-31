import { z } from 'zod';

export const createHandoverSchema = z.object({
  busId: z.string().uuid(),
  terminalId: z.string().uuid().optional(),
  fromShiftId: z.string().uuid().optional(),
  toShiftId: z.string().uuid().optional(),
  handoverTime: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const handoverIdParamSchema = z.object({ id: z.string().uuid() });
export const busIdParamSchema = z.object({ busId: z.string().uuid() });

export const handoverQuerySchema = z.object({
  busId: z.string().uuid().optional(),
  date: z.coerce.date().optional(),
  driverId: z.string().uuid().optional(),
  status: z.string().optional(),
});
