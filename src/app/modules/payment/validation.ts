import { z } from 'zod';

const createPaymentValidation = z.object({
  body: z.object({
    name: z.string({ required_error: 'Payment name is required' }),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

const updatePaymentValidation = z.object({
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const PaymentValidations = {
  createPaymentValidation,
  updatePaymentValidation,
};
