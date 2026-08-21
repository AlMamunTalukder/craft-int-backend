"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createReceiptValidationSchema = exports.receiptInstituteSchema = exports.receiptSummarySchema = exports.receiptFeeSchema = void 0;
const zod_1 = require("zod");
const objectIdSchema = zod_1.z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
exports.receiptFeeSchema = zod_1.z.object({
    feeType: zod_1.z.string().min(1),
    month: zod_1.z.string().optional(),
    originalAmount: zod_1.z.number().nonnegative(),
    discount: zod_1.z.number().nonnegative().optional(),
    waiver: zod_1.z.number().nonnegative().optional(),
    netAmount: zod_1.z.number().nonnegative(),
    paidAmount: zod_1.z.number().nonnegative(),
});
exports.receiptSummarySchema = zod_1.z.object({
    totalItems: zod_1.z.number().int().nonnegative(),
    subtotal: zod_1.z.number().nonnegative(),
    totalDiscount: zod_1.z.number().nonnegative(),
    totalWaiver: zod_1.z.number().nonnegative(),
    totalNetAmount: zod_1.z.number().nonnegative(),
    amountPaid: zod_1.z.number().nonnegative(),
});
exports.receiptInstituteSchema = zod_1.z.object({
    name: zod_1.z.string(),
    address: zod_1.z.string(),
    phone: zod_1.z.string(),
    mobile: zod_1.z.string(),
    email: zod_1.z.string().email(),
    website: zod_1.z.string(),
});
exports.createReceiptValidationSchema = zod_1.z.object({
    receiptNo: zod_1.z.string().min(1),
    student: objectIdSchema,
    studentName: zod_1.z.string().min(1),
    studentId: zod_1.z.string().min(1),
    className: zod_1.z.string().optional(),
    paymentId: objectIdSchema,
    totalAmount: zod_1.z.number().positive(),
    paymentMethod: zod_1.z
        .enum(['cash', 'bkash', 'nagad', 'bank', 'card'])
        .default('cash'),
    paymentDate: zod_1.z.coerce.date().optional(),
    collectedBy: zod_1.z.string().min(1),
    transactionId: zod_1.z.string().optional(),
    note: zod_1.z.string().optional(),
    fees: zod_1.z.array(exports.receiptFeeSchema).min(1),
    summary: exports.receiptSummarySchema,
    institute: exports.receiptInstituteSchema.optional(),
    status: zod_1.z.enum(['active', 'cancelled', 'refunded']).default('active'),
    generatedBy: objectIdSchema.optional(),
});
