"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.certificateValidations = void 0;
const zod_1 = require("zod");
const createCertificateValidation = zod_1.z.object({
    body: zod_1.z.object({
        certificateType: zod_1.z.string().min(1, 'Certificate type is required'),
        student: zod_1.z.string().min(1, 'Student is required'),
        academicYear: zod_1.z.string().optional(),
        issueDate: zod_1.z.string().optional(),
        issuedBy: zod_1.z.string().optional(),
        data: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    }),
});
const updateCertificateValidation = zod_1.z.object({
    body: zod_1.z.object({
        certificateType: zod_1.z.string().optional(),
        student: zod_1.z.string().optional(),
        academicYear: zod_1.z.string().optional(),
        issueDate: zod_1.z.string().optional(),
        issuedBy: zod_1.z.string().optional(),
        data: zod_1.z.record(zod_1.z.string(), zod_1.z.any()).optional(),
    }),
});
exports.certificateValidations = {
    createCertificateValidation,
    updateCertificateValidation,
};
