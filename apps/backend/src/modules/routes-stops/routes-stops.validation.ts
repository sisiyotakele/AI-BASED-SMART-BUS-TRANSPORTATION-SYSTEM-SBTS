import { z } from 'zod';

export const createRouteSchema = z.object({
  routeName: z.string().min(1).max(255).optional(), // Optional now, auto-generated
  description: z.string().optional(),
  startTerminalId: z.string().uuid(),
  endTerminalId: z.string().uuid(),
  status: z.string().optional(),
});

export const updateRouteSchema = z.object({
  routeName: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  startTerminalId: z.string().uuid().optional(),
  endTerminalId: z.string().uuid().optional(),
  status: z.string().optional(),
}).refine(d => Object.keys(d).length > 0, 'At least one field required');

export const createRouteVersionSchema = z.object({
  direction: z.enum(['forward', 'backward']),
  versionName: z.string().max(255).optional(),
  routeStops: z.array(z.object({
    stopId: z.string().uuid(),
    sequenceNumber: z.number().int().positive(),
    estimatedMinutes: z.number().int().nonnegative().optional(),
    distanceKm: z.number().nonnegative().optional(),
  })).optional(),
});

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
  estimatedMinutes: z.coerce.number().int().nonnegative().optional(),
  distanceKm: z.coerce.number().nonnegative().optional(),
});

export const nearbyQuerySchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().positive().default(1),
});
