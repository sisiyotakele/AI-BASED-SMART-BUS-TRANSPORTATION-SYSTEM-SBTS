import { z } from 'zod';

export const createTripSchema = z.object({
  busId: z.string().uuid(),
  driverId: z.string().uuid(),
  versionId: z.string().uuid(),
  scheduleId: z.string().uuid(),
  keyHandoverId: z.string().uuid().optional(),
  scheduledStart: z.coerce.date(),
  scheduledEnd: z.coerce.date(),
});

export const tripIdParamSchema = z.object({ id: z.string().uuid() });

export const tripQuerySchema = z.object({
  driverId: z.string().uuid().optional(),
  status: z.string().optional(),
  busId: z.string().uuid().optional(),
  date: z.coerce.date().optional(),
});

export const stateTransitionSchema = z.object({});
