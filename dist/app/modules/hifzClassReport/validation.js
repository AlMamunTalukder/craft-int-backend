"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hifzReportValidation = exports.reportRowValidation = exports.studentInfoValidation = void 0;
// hifzReport.validation.ts
const zod_1 = require("zod");
exports.studentInfoValidation = zod_1.z.object({
    studentName: zod_1.z.string(),
    studentId: zod_1.z.string(),
    class: zod_1.z.string(),
    date: zod_1.z.string(),
});
exports.reportRowValidation = zod_1.z.object({
    id: zod_1.z.string(),
    section: zod_1.z.string().optional(),
    title: zod_1.z.string(),
    lesson: zod_1.z.string().optional().default(""),
    dailyFoundation: zod_1.z.string().optional().default(""),
    weeklyFoundation: zod_1.z.string().optional().default(""),
    teacherSignature: zod_1.z.string().optional().default(""),
});
exports.hifzReportValidation = zod_1.z.object({
    studentInfo: exports.studentInfoValidation,
    reportRows: zod_1.z.array(exports.reportRowValidation),
    createdAt: zod_1.z.string().optional(),
});
