import { z } from 'zod';

export const createFeeCategoryValidation = z.object({
  body: z.object({
    class: z.string(),
    feeType: z.string(),
    feeAmount: z.number(),
  }),
});

export const updateFeeCategoryValidation = z.object({
  body: z.object({
    class: z.string().optional(),
    feeType: z.string().optional(),
    feeAmount: z.number().optional(),
  }),
});
