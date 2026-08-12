import { z } from 'zod';

export const createIncidentSchema = z.object({
  tripId: z.string().uuid(),
  incidentType: z.string().min(1).max(255),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  photoUrl: z.string().url().optional(),
});

export const resolveIncidentSchema = z.object({
  resolutionNotes: z.string().min(1, 'Resolution notes required'),
});

export const incidentIdParamSchema = z.object({ id: z.string().uuid() });
export const incidentQuerySchema = z.object({
  status: z.string().optional(),
  tripId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
});
