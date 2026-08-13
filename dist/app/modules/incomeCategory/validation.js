"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncomeCategoryValidations = void 0;
const zod_1 = require("zod");
const createIncomeCategoryValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string({ required_error: 'IncomeCategory name is required' })
    }),
});
const updateIncomeCategoryValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
    }),
});
exports.IncomeCategoryValidations = {
    createIncomeCategoryValidation,
    updateIncomeCategoryValidation,
};
