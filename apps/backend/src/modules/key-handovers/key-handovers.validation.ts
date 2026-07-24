import { z } from 'zod';

export const createHandoverSchema = z.object({
  busId: z.string().uuid(),
  terminalId: z.string().uuid(),
  fromShiftId: z.string().uuid().optional(),
  toShiftId: z.string().uuid(),
  handoverTime: z.coerce.date(),
  notes: z.string().optional(),
});

export const confirmSchema = z.object({});

export const handoverIdParamSchema = z.object({ id: z.string().uuid() });
export const handoverQuerySchema = z.object({
  busId: z.string().uuid().optional(),
  date: z.coerce.date().optional(),
});
