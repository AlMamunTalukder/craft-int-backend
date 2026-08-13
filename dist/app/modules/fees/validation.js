"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeValidation = exports.createFeeZodSchema = exports.updateFeeSchema = exports.payFeeSchema = exports.createFeeSchema = void 0;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const objectId = zod_1.z
    .string()
    .refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
    message: 'Invalid ObjectId',
});
exports.createFeeSchema = zod_1.z.object({
    body: zod_1.z.object({
        feeType: zod_1.z.string({ required_error: 'Fee type is required' }),
        month: zod_1.z.string().optional(),
        amount: zod_1.z.number({ required_error: 'Amount is required' }),
        paymentMethod: zod_1.z.string().optional(),
        paidAmount: zod_1.z.number().min(0).optional().default(0),
        transactionId: zod_1.z.string().optional(),
        receiptNo: zod_1.z.string().optional(),
        paymentDate: zod_1.z.preprocess((arg) => (arg ? new Date(arg) : undefined), zod_1.z.date().optional()),
    }),
});
exports.payFeeSchema = zod_1.z.object({
    body: zod_1.z.object({
        feeId: objectId,
        payAmount: zod_1.z.number().min(1, 'Pay at least 1'),
        paymentMethod: zod_1.z.enum(['cash', 'bkash', 'bank', 'online']).optional(),
        transactionId: zod_1.z.string().optional(),
        receiptNo: zod_1.z.string().optional(),
        paymentDate: zod_1.z.preprocess((arg) => (arg ? new Date(arg) : new Date()), zod_1.z.date().optional()),
    }),
});
exports.updateFeeSchema = zod_1.z.object({
    params: zod_1.z.object({ id: objectId }),
    body: zod_1.z
        .object({
        amount: zod_1.z.number().min(0).optional(),
        paidAmount: zod_1.z.number().min(0).optional(),
        status: zod_1.z.enum(['paid', 'partial', 'unpaid']).optional(),
        paymentMethod: zod_1.z.enum(['cash', 'bkash', 'bank', 'online']).optional(),
        transactionId: zod_1.z.string().optional(),
        receiptNo: zod_1.z.string().optional(),
        paymentDate: zod_1.z.preprocess((arg) => (arg ? new Date(arg) : undefined), zod_1.z.date().optional()),
    })
        .partial(),
});
exports.createFeeZodSchema = zod_1.z.object({
    body: zod_1.z.object({
        class: zod_1.z.string({
            required_error: 'Class is required',
        }),
        amount: zod_1.z.number().optional(),
        feeType: zod_1.z.string().optional(),
        academicYear: zod_1.z.string().optional(),
        discount: zod_1.z.number().min(0).optional(),
        waiver: zod_1.z.number().min(0).optional(),
        dueDate: zod_1.z.string().optional(),
    }),
});
exports.FeeValidation = {
    createFeeZodSchema: exports.createFeeZodSchema,
};
