"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.examValidations = void 0;
const zod_1 = require("zod");
const subjectSchema = zod_1.z.object({
    subject: zod_1.z.string().min(1, 'Subject name is required'),
    fullMarks: zod_1.z.number().min(1),
    passMarks: zod_1.z.number().min(0),
});
const createExamValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Exam name is required'),
        examType: zod_1.z.string().min(1, 'Exam type is required'),
        className: zod_1.z.string().min(1, 'Class is required'),
        department: zod_1.z.string().optional(),
        academicYear: zod_1.z.string().min(1, 'Academic year is required'),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        subjects: zod_1.z.array(subjectSchema).min(1, 'At least one subject is required'),
        status: zod_1.z.string().optional(),
    }),
});
const updateExamValidation = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        examType: zod_1.z.string().optional(),
        className: zod_1.z.string().optional(),
        department: zod_1.z.string().optional(),
        academicYear: zod_1.z.string().optional(),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        subjects: zod_1.z.array(subjectSchema).optional(),
        status: zod_1.z.string().optional(),
    }),
});
const upsertMarksValidation = zod_1.z.object({
    body: zod_1.z.object({
        examId: zod_1.z.string().min(1),
        className: zod_1.z.string().min(1),
        entries: zod_1.z
            .array(zod_1.z.object({
            student: zod_1.z.string().min(1),
            marks: zod_1.z
                .array(zod_1.z.object({
                subject: zod_1.z.string().min(1),
                obtained: zod_1.z.number().min(0),
            }))
                .min(1),
        }))
            .min(1),
    }),
});
const publishExamValidation = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(['draft', 'published', 'completed']),
    }),
});
exports.examValidations = {
    createExamValidation,
    updateExamValidation,
    upsertMarksValidation,
    publishExamValidation,
};
