"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MealReportValidations = exports.createMealReportValidation = void 0;
const zod_1 = require("zod");
const mongoose_1 = __importDefault(require("mongoose"));
const mealreport_interface_1 = require("./mealreport.interface");
const mealParticipantSchema = zod_1.z.object({
    personId: zod_1.z
        .string({ required_error: 'Person ID is required' })
        .refine((val) => mongoose_1.default.Types.ObjectId.isValid(val), {
        message: 'Invalid person ID',
    }),
    mealTypes: zod_1.z
        .array(zod_1.z.nativeEnum(mealreport_interface_1.MealType), {
        required_error: 'Meal types are required',
    })
        .min(1, { message: 'At least one meal type is required' }),
    mealCount: zod_1.z
        .number({ required_error: 'Meal count is required' })
        .min(1, { message: 'Minimum 1 meal is required' })
        .max(3, { message: 'Maximum 3 meals allowed' }),
});
exports.createMealReportValidation = zod_1.z.object({
    body: zod_1.z.object({
        date: zod_1.z.string({
            required_error: 'Date is required',
        }),
        students: zod_1.z
            .array(mealParticipantSchema)
            .min(1, { message: 'At least one student is required' }),
        teachers: zod_1.z
            .array(mealParticipantSchema)
            .min(1, { message: 'At least one teacher is required' }),
    }),
});
const updateMealReportValidation = zod_1.z.object({
    body: zod_1.z.object({
        date: zod_1.z
            .string({
            required_error: 'Date is required',
        })
            .optional(),
        students: zod_1.z
            .array(mealParticipantSchema)
            .min(1, { message: 'At least one student is required' })
            .optional(),
        teachers: zod_1.z
            .array(mealParticipantSchema)
            .min(1, { message: 'At least one teacher is required' })
            .optional(),
    }),
});
exports.MealReportValidations = {
    createMealReportValidation: exports.createMealReportValidation,
    updateMealReportValidation,
};
