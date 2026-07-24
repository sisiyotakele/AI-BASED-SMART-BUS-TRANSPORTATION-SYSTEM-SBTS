import { z } from 'zod';

export const busIdParamSchema = z.object({
  busId: z.string().uuid('Invalid bus ID format'),
});

export const locationUpdateSchema = z.object({
  busId: z.string().uuid('Invalid bus ID format'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speed: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  timestamp: z.string().datetime().or(z.date()),
});
