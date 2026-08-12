import { z } from 'zod';

export const trafficPredictionSchema = z.object({
    origin_lat: z.number().min(-90).max(90),
    origin_lon: z.number().min(-180).max(180),
    dest_lat: z.number().min(-90).max(90),
    dest_lon: z.number().min(-180).max(180),
    route_id: z.string().uuid().optional(),
    direction: z.string().optional(),
    timestamp: z.string().datetime().optional(),
});

export const etaPredictionSchema = trafficPredictionSchema.extend({
    mileage: z.number().positive().optional(),
});

export const combinedPredictionSchema = etaPredictionSchema;

export const batchPredictionSchema = z.object({
    trips: z.array(combinedPredictionSchema).min(1).max(100),
});
