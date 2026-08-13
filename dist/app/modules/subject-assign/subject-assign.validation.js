"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubjectValidations = void 0;
const zod_1 = require("zod");
const createSubjectValidation = zod_1.z.object({
    body: zod_1.z.object({
        subjectName: zod_1.z.string({
            required_error: 'Subject name is required',
        }),
        subjectCode: zod_1.z
            .string({
            required_error: 'Subject code is required',
        })
            .min(2, 'Subject code must be at least 2 characters'),
        description: zod_1.z.string().optional(),
        classId: zod_1.z.string({
            required_error: 'Class ID is required',
        }),
        teacherId: zod_1.z.string().optional(),
    }),
});
const updateSubjectValidation = zod_1.z.object({
    body: zod_1.z.object({
        subjectName: zod_1.z.string().optional(),
        subjectCode: zod_1.z.string().min(2).optional(),
        description: zod_1.z.string().optional(),
        classId: zod_1.z.string().optional(),
        teacherId: zod_1.z.string().optional(),
    }),
});
exports.SubjectValidations = {
    createSubjectValidation,
    updateSubjectValidation,
};
