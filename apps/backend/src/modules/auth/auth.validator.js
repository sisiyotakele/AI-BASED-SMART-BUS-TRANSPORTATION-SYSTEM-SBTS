import { z } from 'zod';
export const loginSchema = z.object({
    email: z.string().trim().email('Invalid email address format'),
    password: z.string().min(1, 'Password cannot be empty'),
});
