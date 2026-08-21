"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyClassReportValidations = void 0;
const zod_1 = require("zod");
const reportRowSchema = zod_1.z.object({
    subject: zod_1.z
        .string({ required_error: 'Subject is required' })
        .min(1, 'Subject must not be empty'),
    class: zod_1.z
        .string({ required_error: 'Class is required' })
        .min(1, 'Class must not be empty'),
    fullyLearned: zod_1.z
        .number({ required_error: 'Fully learned count is required' })
        .min(0, 'Fully learned must be 0 or more'),
    partiallyLearned: zod_1.z
        .number({ required_error: 'Partially learned count is required' })
        .min(0, 'Partially learned must be 0 or more'),
    notLearned: zod_1.z
        .number({ required_error: 'Not learned count is required' })
        .min(0, 'Not learned must be 0 or more'),
    lessonDetails: zod_1.z
        .string({ required_error: 'Lesson details are required' })
        .min(1, 'Lesson details must not be empty'),
    homework: zod_1.z
        .string({ required_error: 'Homework is required' })
        .min(1, 'Homework must not be empty'),
    diaryCompleted: zod_1.z.enum(['হ্যাঁ', 'না'], {
        required_error: 'Diary completed status is required',
    }),
});
const createReportValidation = zod_1.z.object({
    body: zod_1.z.object({
        teacherName: zod_1.z
            .string({ required_error: 'Teacher name is required' })
            .min(1, 'Teacher name must not be empty'),
        date: zod_1.z
            .string({ required_error: 'Date is required' })
            .min(1, 'Date must not be empty'),
        classes: zod_1.z
            .array(reportRowSchema, { required_error: 'At least one row is required' })
            .min(1, 'At least one row must be provided'),
    }),
});
const updateReportValidation = zod_1.z.object({
    body: zod_1.z.object({
        teacherName: zod_1.z.string().min(1, 'Teacher name must not be empty').optional(),
        date: zod_1.z.string().min(1, 'Date must not be empty').optional(),
        classes: zod_1.z.array(reportRowSchema).optional(),
    }),
});
exports.DailyClassReportValidations = {
    createReportValidation,
    updateReportValidation,
};
