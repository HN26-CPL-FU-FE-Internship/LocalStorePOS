import { z } from 'zod';

export const loginSchema = z.object({
    email: z.email('Email format is invalid'),
    password: z.string().min(8, 'Password must at least 8 characters'),
});

export type LoginForm = z.infer<typeof loginSchema>;
