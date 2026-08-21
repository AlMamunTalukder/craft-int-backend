"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFeeCategoryValidation = exports.createFeeCategoryValidation = exports.feeTypeSchema = exports.categoryNameEnum = void 0;
// feeCategory.validation.ts
const zod_1 = require("zod");
exports.categoryNameEnum = zod_1.z.union([
    zod_1.z.enum([
        'Residential',
        'Non-Residential',
        'Day Care',
        'Non-Residential One Meal',
        'Day Care One Meal',
        "Residential No Meal"
    ]),
    zod_1.z.literal(''),
]);
exports.feeTypeSchema = zod_1.z
    .string({
    required_error: 'Fee type is required',
})
    .min(2, 'Fee type must be at least 2 characters')
    .max(50, 'Fee type too long');
const feeItemSchema = zod_1.z.object({
    feeType: exports.feeTypeSchema,
    amount: zod_1.z
        .number({
        required_error: 'Amount is required',
        invalid_type_error: 'Amount must be a number',
    })
        .positive('Amount must be greater than 0'),
});
const singleFeeCategorySchema = zod_1.z.object({
    categoryName: exports.categoryNameEnum.optional(),
    className: zod_1.z.string().min(1, 'Class name is required'),
    feeItems: zod_1.z.array(feeItemSchema).min(1),
});
const multipleFeeCategoriesSchema = zod_1.z.array(singleFeeCategorySchema);
exports.createFeeCategoryValidation = zod_1.z.object({
    body: zod_1.z.union([singleFeeCategorySchema, multipleFeeCategoriesSchema]),
});
exports.updateFeeCategoryValidation = zod_1.z.object({
    body: zod_1.z.object({
        categoryName: exports.categoryNameEnum.optional(),
        className: zod_1.z.string().min(1).optional(),
        feeItems: zod_1.z.array(feeItemSchema).optional(),
    }),
});
