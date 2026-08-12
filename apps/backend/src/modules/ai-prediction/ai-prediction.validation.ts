import { z } from 'zod';

export const createModelSchema = z.object({
  version: z.string().min(1).max(255),
  accuracy: z.coerce.number().min(0).max(100).optional(),
  trainedAt: z.coerce.date().optional(),
  datasetSize: z.coerce.number().int().positive().optional(),
  modelParameters: z.string().optional(),
});

export const activateModelSchema = z.object({});

export const modelIdParamSchema = z.object({ id: z.string().uuid() });

export const predictionQuerySchema = z.object({
  routeId: z.string().uuid(),
  versionId: z.string().uuid().optional(),
  time: z.coerce.date(),
});
