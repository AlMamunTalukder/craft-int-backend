"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.expenseSchema = exports.expenseItemSchema = void 0;
const zod_1 = require("zod");
exports.expenseItemSchema = zod_1.z.object({
    source: zod_1.z.string().min(1, 'Expense source is required'),
    description: zod_1.z.string().optional(),
    amount: zod_1.z.number(),
});
exports.expenseSchema = zod_1.z.object({
    body: zod_1.z.object({
        category: zod_1.z.string().optional(),
        note: zod_1.z.string().optional(),
        expenseDate: zod_1.z.string().min(1, 'Date is required'),
        paymentMethod: zod_1.z.string().min(1, 'Payment method is required'),
        status: zod_1.z.string().optional(),
        buyer: zod_1.z.string().optional(),
        payer: zod_1.z.string().optional(),
        expenseItems: zod_1.z
            .array(exports.expenseItemSchema)
            .min(1, 'At least one expense item is required'),
        totalAmount: zod_1.z.number().optional(),
    }),
});
