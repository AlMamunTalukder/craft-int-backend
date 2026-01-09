import { z } from 'zod';

const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const receiptFeeSchema = z.object({
  feeType: z.string().min(1),
  month: z.string().optional(),
  originalAmount: z.number().nonnegative(),
  discount: z.number().nonnegative().optional(),
  waiver: z.number().nonnegative().optional(),
  netAmount: z.number().nonnegative(),
  paidAmount: z.number().nonnegative(),
});

export const receiptSummarySchema = z.object({
  totalItems: z.number().int().nonnegative(),
  subtotal: z.number().nonnegative(),
  totalDiscount: z.number().nonnegative(),
  totalWaiver: z.number().nonnegative(),
  totalNetAmount: z.number().nonnegative(),
  amountPaid: z.number().nonnegative(),
});

export const receiptInstituteSchema = z.object({
  name: z.string(),
  address: z.string(),
  phone: z.string(),
  mobile: z.string(),
  email: z.string().email(),
  website: z.string(),
});

export const createReceiptValidationSchema = z.object({
  receiptNo: z.string().min(1),

  student: objectIdSchema,
  studentName: z.string().min(1),
  studentId: z.string().min(1),
  className: z.string().optional(),

  paymentId: objectIdSchema,
  totalAmount: z.number().positive(),

  paymentMethod: z
    .enum(['cash', 'bkash', 'nagad', 'bank', 'card'])
    .default('cash'),
  paymentDate: z.coerce.date().optional(),

  collectedBy: z.string().min(1),
  transactionId: z.string().optional(),
  note: z.string().optional(),

  fees: z.array(receiptFeeSchema).min(1),
  summary: receiptSummarySchema,

  institute: receiptInstituteSchema.optional(),

  status: z.enum(['active', 'cancelled', 'refunded']).default('active'),
  generatedBy: objectIdSchema.optional(),
});
