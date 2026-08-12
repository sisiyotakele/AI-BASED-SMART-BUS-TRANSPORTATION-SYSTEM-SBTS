import { z } from 'zod';

export const createDriverSchema = z.object({
  fullName: z.string().min(2).max(255),
  email: z.string().email(),
  phone: z.string().min(10).max(255),
  password: z.string().min(8).max(255),
  homeTerminalId: z.string().uuid().optional(),
  licenseNumber: z.string().min(1).max(255),
  licenseExpiry: z.coerce.date(),
  preferredLanguage: z.string().max(50).optional(),
  department: z.string().max(255).optional(),
});

export const updateDriverSchema = z.object({
  fullName: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(10).max(255).optional(),
  homeTerminalId: z.string().uuid().optional(),
  licenseNumber: z.string().min(1).max(255).optional(),
  licenseExpiry: z.coerce.date().optional(),
  preferredLanguage: z.string().max(50).optional(),
  department: z.string().max(255).optional(),
  isActive: z.boolean().optional(),
}).refine(d => Object.keys(d).length > 0, 'At least one field required');

export const driverIdParamSchema = z.object({ id: z.string().uuid() });
