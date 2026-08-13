"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFeeAdjustmentValidation = exports.createFeeAdjustmentValidation = exports.FeeAdjustmentValidation = void 0;
const zod_1 = require("zod");
exports.FeeAdjustmentValidation = zod_1.z.object({
    student: zod_1.z.string().min(1, "Student ID is required"),
    fee: zod_1.z.string().min(1, "Fee ID is required"),
    type: zod_1.z.enum(["discount", "waiver"]),
    amount: zod_1.z.number().positive("Amount must be greater than 0"),
    reason: zod_1.z.string().optional(),
    approvedBy: zod_1.z.string().optional(),
    approvedDate: zod_1.z.date().optional(),
    startMonth: zod_1.z.string().optional(),
    endMonth: zod_1.z.string().optional(),
});
exports.createFeeAdjustmentValidation = exports.FeeAdjustmentValidation;
exports.updateFeeAdjustmentValidation = exports.FeeAdjustmentValidation.partial();
