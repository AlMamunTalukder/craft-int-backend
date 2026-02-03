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

export const feeTypeEnum = z.enum([
  'Monthly Fee',
  'Tuition Fee',
  'Meal Fee',
  'Seat Rent',
  'Day Care Fee',
  'One Meal',
  'Exam Fee',
  'Admission Fee',
]);

const feeItemSchema = z.object({
  feeType: feeTypeEnum,
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
