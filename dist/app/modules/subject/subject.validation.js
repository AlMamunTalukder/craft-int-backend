"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subjectValidation = exports.updateSubjectSchema = exports.createSubjectSchema = void 0;
const zod_1 = require("zod");
exports.createSubjectSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Subject name is required').trim(),
        paper: zod_1.z.string().optional(),
    }),
});
exports.updateSubjectSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().optional(),
        paper: zod_1.z.string().optional(),
    }),
});
exports.subjectValidation = {
    createSubjectSchema: exports.createSubjectSchema,
    updateSubjectSchema: exports.updateSubjectSchema,
};
