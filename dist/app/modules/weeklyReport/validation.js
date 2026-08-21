"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WeeklyReportValidations = void 0;
const zod_1 = require("zod");
const reportTypeEnum = zod_1.z.enum(["nazera", "ampara", "hifz", "qaida"]);
const reportRowSchema = zod_1.z.object({
    label: zod_1.z.string({
        required_error: "Label is required",
    }),
    values: zod_1.z
        .array(zod_1.z.string().optional())
        .min(1, "At least one value required")
        .max(10, "Too many values"),
});
const createWeeklyReportValidation = zod_1.z.object({
    body: zod_1.z.object({
        studentName: zod_1.z.string({
            required_error: "Student name is required",
        }),
        month: zod_1.z.string({
            required_error: "Month is required",
        }),
        reportType: reportTypeEnum,
        rows: zod_1.z
            .array(reportRowSchema)
            .nonempty("At least one report row is required"),
    }),
});
const updateWeeklyReportValidation = zod_1.z.object({
    body: zod_1.z.object({
        studentName: zod_1.z.string().optional(),
        month: zod_1.z.string().optional(),
        reportType: reportTypeEnum.optional(),
        rows: zod_1.z.array(reportRowSchema).optional(),
    }),
});
exports.WeeklyReportValidations = {
    createWeeklyReportValidation,
    updateWeeklyReportValidation,
};
