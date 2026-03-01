import mongoose from 'mongoose';
import { z } from 'zod';

const flexibleEnrollment = z
  .union([z.string(), z.null(), z.undefined()])
  .optional()
  .transform((val) => {
    if (!val) return undefined;
    return val;
  });
const objectId = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId',
  })
  .optional();

const dateField = z.preprocess(
  (arg) => (arg ? new Date(arg as string) : undefined),
  z.date().optional(),
);

const paymentMethodEnum = z.enum(['cash', 'bkash', 'nagad', 'bank', 'online']); // Added 'nagad' as seen in frontend

export const createFeeSchema = z.object({
  body: z.object({
    // enrollment: flexibleEnrollment,
    student: flexibleEnrollment,
    class: z.string({
      required_error: 'Class is required',
    }),

    month: z.string({
      required_error: 'Month is required',
    }),

    amount: z
      .number({ required_error: 'Amount is required' })
      .min(0, 'Amount cannot be negative'),

    discount: z.number().min(0).optional().default(0),
    waiver: z.number().min(0).optional().default(0),

    feeType: z.string({
      required_error: 'Fee type is required',
    }),

    academicYear: z.string({
      required_error: 'Academic year is required',
    }),

    paidAmount: z.number().min(0).optional().default(0),
    advanceUsed: z.number().min(0).optional().default(0),

    isCurrentMonth: z.boolean().optional(),
  }),
});
/* -----------------------------------------------------
   Other Schemas (Kept for reference)
----------------------------------------------------- */

export const payFeeSchema = z.object({
  body: z.object({
    feeId: flexibleEnrollment,
    payAmount: z
      .number({ required_error: 'Payment amount is required' })
      .min(1),
    paymentMethod: paymentMethodEnum,
    transactionId: z.string().optional(),
    receiptNo: z.string().optional(),
    paymentDate: z.preprocess(
      (arg) => (arg ? new Date(arg as string) : new Date()),
      z.date(),
    ),
  }),
});

export const updateFeeSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    amount: z.number().min(0).optional(),
    paidAmount: z.number().min(0).optional(),
    advanceUsed: z.number().min(0).optional(),
    discount: z.number().min(0).optional(),
    waiver: z.number().min(0).optional(),
    status: z.enum(['paid', 'partial', 'unpaid']).optional(),
    paymentMethod: paymentMethodEnum.optional(),
    transactionId: z.string().optional(),
    receiptNo: z.string().optional(),
    paymentDate: dateField,
    dueDate: dateField,
    lateFeePerDay: z.number().min(0).optional(),
    lateFeeAmount: z.number().min(0).optional(),
    isCurrentMonth: z.boolean().optional(),
  }),
});

export const customizeLateFeeSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({
    newAmount: z.number({ required_error: 'New amount is required' }).min(0),
    reason: z.string({ required_error: 'Reason is required' }).min(5),
    customizedBy: z
      .string({ required_error: 'Customized by is required' })
      .min(2),
    notes: z.string().optional(),
  }),
});

export const FeeValidation = {
  createFeeSchema,
  payFeeSchema,
  updateFeeSchema,
  customizeLateFeeSchema,
};
