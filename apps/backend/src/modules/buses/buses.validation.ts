import { z } from 'zod';

export const createBusSchema = z.object({
  terminalId: z.string().uuid().optional(),
  plateNumber: z.string().min(1).max(255),
  model: z.string().min(1).max(255),
  capacity: z.coerce.number().int().positive(),
  maintenanceStatus: z.enum(['operational', 'in_maintenance', 'retired']).default('operational'),
});

export const updateBusSchema = z.object({
  terminalId: z.string().uuid().optional(),
  plateNumber: z.string().min(1).max(255).optional(),
  model: z.string().min(1).max(255).optional(),
  capacity: z.coerce.number().int().positive().optional(),
  maintenanceStatus: z.enum(['operational', 'in_maintenance', 'retired']).optional(),
}).refine(d => Object.keys(d).length > 0, 'At least one field required');

export const busIdParamSchema = z.object({ id: z.string().uuid() });
