import { z } from 'zod';

export const createUserSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(3, 'Phone is required'),
  password: z.string().min(4, 'Password must be at least 4 characters').optional(),
  isActive: z.boolean().optional(),
  department: z.string().optional(),
  roles: z.array(z.string()).optional(),
});

export const updateUserSchema = createUserSchema.partial();
