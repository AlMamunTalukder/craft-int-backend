"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentValidations = void 0;
const zod_1 = require("zod");
const createPaymentValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'Payment name is required' }),
        description: zod_1.z.string().optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
const updatePaymentValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        description: zod_1.z.string().optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
exports.PaymentValidations = {
    createPaymentValidation,
    updatePaymentValidation,
};
