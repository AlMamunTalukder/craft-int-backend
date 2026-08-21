"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incomeSchema = exports.incomeItemSchema = void 0;
const zod_1 = require("zod");
exports.incomeItemSchema = zod_1.z.object({
    source: zod_1.z.string().min(1, 'Income source is required'),
    amount: zod_1.z.number(),
});
exports.incomeSchema = zod_1.z.object({
    body: zod_1.z.object({
        note: zod_1.z.string().optional(),
        incomeDate: zod_1.z.string().min(1, 'Date is required'),
        paymentMethod: zod_1.z.string().min(1, 'Payment method is required'),
        incomeItems: zod_1.z
            .array(exports.incomeItemSchema)
            .min(1, 'At least one income item is required'),
    }),
});
