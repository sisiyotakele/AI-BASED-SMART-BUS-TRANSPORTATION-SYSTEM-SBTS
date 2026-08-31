import { z } from 'zod';

export const createTripSchema = z.object({
  scheduleId: z.string().uuid().optional(),
  tripDate: z.string().optional(),
  busId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  versionId: z.string().uuid().optional(),
  keyHandoverId: z.string().uuid().optional(),
  scheduledStart: z.coerce.date().optional(),
  scheduledEnd: z.coerce.date().optional(),
  notes: z.string().max(1000).optional(),
  estimatedDurationMinutes: z.number().int().positive().optional(),
}).refine((data) => {
  if (data.scheduleId) return true;
  return !!(data.busId && data.driverId && data.versionId && data.scheduledStart);
}, {
  message: "Either scheduleId or complete trip details (busId, driverId, versionId, scheduledStart) must be provided."
});

export const tripIdParamSchema = z.object({ id: z.string().uuid() });

export const tripQuerySchema = z.object({
  driverId: z.string().uuid().optional(),
  status: z.string().optional(),
  busId: z.string().uuid().optional(),
  routeId: z.string().uuid().optional(),
  date: z.coerce.date().optional(),
});

export const stateTransitionSchema = z.object({});

