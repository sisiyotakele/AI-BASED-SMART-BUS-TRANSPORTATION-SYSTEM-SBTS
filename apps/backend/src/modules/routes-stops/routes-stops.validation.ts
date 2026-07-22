import { z } from 'zod';

export const createRouteSchema = z.object({
  routeName: z.string().min(1).max(255),
  description: z.string().optional(),
  startStopId: z.string().uuid(),
  endStopId: z.string().uuid(),
});

export const updateRouteSchema = z.object({
  routeName: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  startStopId: z.string().uuid().optional(),
  endStopId: z.string().uuid().optional(),
}).refine(d => Object.keys(d).length > 0, 'At least one field required');

export const routeIdParamSchema = z.object({ id: z.string().uuid() });

export const createStopSchema = z.object({
  terminalId: z.string().uuid().optional(),
  stopName: z.string().min(1).max(255),
  stopCode: z.string().min(1).max(255),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  address: z.string().optional(),
});

export const updateStopSchema = z.object({
  terminalId: z.string().uuid().optional(),
  stopName: z.string().min(1).max(255).optional(),
  stopCode: z.string().min(1).max(255).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  address: z.string().optional(),
}).refine(d => Object.keys(d).length > 0, 'At least one field required');

export const stopIdParamSchema = z.object({ id: z.string().uuid() });

export const addRouteStopSchema = z.object({
  stopId: z.string().uuid(),
  sequenceNumber: z.coerce.number().int().positive(),
  estimatedMinutes: z.coerce.number().int().positive().optional(),
  distanceKm: z.coerce.number().positive().optional(),
});

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().default(1),
});
