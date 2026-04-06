import { z } from 'zod';

const createUserValidation = z.object({
  body: z.object({
<<<<<<< HEAD
    name: z.string().optional(),
    userId: z.string({ required_error: 'user id is required' }).optional(),
=======
    name: z.string().optional(), 
    userId: z.string({ required_error: 'user id is required' }),
>>>>>>> 72c36e6b84459b5971bdfa208536778546dcd400
    email: z.string({ required_error: 'Email is required' }).optional(),
    password: z
      .string({
        required_error: 'Password is required',
      })
      .optional(),
    role: z
      .enum([
        'admin',
        'user',
        'super_visor',
        'teacher',
        'super_admin',
        'accountant',
      ])
      .default('user'),
    status: z.enum(['active', 'inactive']).default('active'),
    isDeleted: z.boolean().default(false),
  }),
});

export const userValidations = {
  createUserValidation,
};
