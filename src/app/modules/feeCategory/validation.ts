// feeCategory.validation.ts
import { z } from 'zod';

export const categoryNameEnum = z.union([
  z.enum([
    'Residential',
    'Non-Residential',
    'Day Care',
    'Non-Residential One Meal',
    'Day Care One Meal',
  ]),
  z.literal(''),
]);

export const feeTypeSchema = z
  .string({
    required_error: 'Fee type is required',
  })
  .min(2, 'Fee type must be at least 2 characters')
  .max(50, 'Fee type too long');

const feeItemSchema = z.object({
  feeType: feeTypeSchema,
  amount: z
    .number({
      required_error: 'Amount is required',
      invalid_type_error: 'Amount must be a number',
    })
    .positive('Amount must be greater than 0'),
});

const singleFeeCategorySchema = z.object({
  categoryName: categoryNameEnum.optional(),
  className: z.string().min(1, 'Class name is required'),
  feeItems: z.array(feeItemSchema).min(1),
});

const multipleFeeCategoriesSchema = z.array(singleFeeCategorySchema);

export const createFeeCategoryValidation = z.object({
  body: z.union([singleFeeCategorySchema, multipleFeeCategoriesSchema]),
});

export const updateFeeCategoryValidation = z.object({
  body: z.object({
    categoryName: categoryNameEnum.optional(),
    className: z.string().min(1).optional(),
    feeItems: z.array(feeItemSchema).optional(),
  }),
});
