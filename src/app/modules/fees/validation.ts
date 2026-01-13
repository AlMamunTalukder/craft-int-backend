// validations/fee.validation.ts
import { z } from 'zod';
import mongoose from 'mongoose';

// helper: validate ObjectId string
const objectId = z
  .string()
  .refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId',
  });

export const createFeeSchema = z.object({
  body: z.object({
    enrollment: objectId,
    student: objectId,
    feeType: z.string({ required_error: 'Fee type is required' }),
    month: z.string().optional(),
    amount: z.number({ required_error: 'Amount is required' }),
    paymentMethod: z.string().optional(),
    paidAmount: z.number().min(0).optional().default(0),
    transactionId: z.string().optional(),
    receiptNo: z.string().optional(),
    paymentDate: z.preprocess(
      (arg) => (arg ? new Date(arg as string) : undefined),
      z.date().optional(),
    ),
  }),
});

export const payFeeSchema = z.object({
  body: z.object({
    feeId: objectId,
    payAmount: z.number().min(1, 'Pay at least 1'),
    paymentMethod: z.enum(['cash', 'bkash', 'bank', 'online']).optional(),
    transactionId: z.string().optional(),
    receiptNo: z.string().optional(),
    paymentDate: z.preprocess(
      (arg) => (arg ? new Date(arg as string) : new Date()),
      z.date().optional(),
    ),
  }),
});

export const updateFeeSchema = z.object({
  params: z.object({ id: objectId }),
  body: z
    .object({
      amount: z.number().min(0).optional(),
      paidAmount: z.number().min(0).optional(),
      status: z.enum(['paid', 'partial', 'unpaid']).optional(),
      paymentMethod: z.enum(['cash', 'bkash', 'bank', 'online']).optional(),
      transactionId: z.string().optional(),
      receiptNo: z.string().optional(),
      paymentDate: z.preprocess(
        (arg) => (arg ? new Date(arg as string) : undefined),
        z.date().optional(),
      ),
    })
    .partial(),
});

export const createFeeZodSchema = z.object({
  body: z.object({
    class: z.string({
      required_error: 'Class is required',
    }),

    amount: z.number().optional(),
    feeType: z.string().optional(),
    academicYear: z.string().optional(),
    enrollmentId: z.string().optional(),
    discount: z.number().min(0).optional(),
    waiver: z.number().min(0).optional(),
    dueDate: z.string().optional(),
  }),
});

export const FeeValidation = {
  createFeeZodSchema,
};
