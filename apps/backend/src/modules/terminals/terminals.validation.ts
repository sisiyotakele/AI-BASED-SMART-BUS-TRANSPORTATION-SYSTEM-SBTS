import { z } from 'zod';

export const createTerminalSchema = z.object({
  terminalName: z.string().min(1).max(255),
  address: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  capacity: z.coerce.number().int().positive().optional(),
  facilities: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
  phoneNumber: z.string().max(20).optional(),
  managerName: z.string().max(255).optional(),
  email: z.string().email().max(255).optional(),
});

export const updateTerminalSchema = z.object({
  terminalName: z.string().min(1).max(255).optional(),
  address: z.string().optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  capacity: z.coerce.number().int().positive().optional(),
  facilities: z.string().optional(),
  status: z.enum(['active', 'inactive', 'maintenance']).optional(),
  phoneNumber: z.string().max(20).optional(),
  managerName: z.string().max(255).optional(),
  email: z.string().email().max(255).optional(),
}).refine(d => Object.keys(d).length > 0, 'At least one field required');

export const terminalIdParamSchema = z.object({ id: z.string().uuid() });
