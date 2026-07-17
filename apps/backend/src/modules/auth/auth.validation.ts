import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email address').max(255),
  phone: z.string()
    .min(10, 'Phone must be at least 10 characters')
    .max(20, 'Phone must be at most 20 characters')
    .regex(/^\+?[0-9]+$/, 'Phone must contain only numbers and optional + prefix'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(255, 'Password must be at most 255 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character (!@#$%^&*etc)'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const logoutSchema = z.object({
  refreshToken: z.string().optional(), // Optional - if not provided, won't revoke any token
});
