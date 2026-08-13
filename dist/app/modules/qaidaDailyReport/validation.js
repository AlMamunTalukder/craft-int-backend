"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateQaidaDailyReportSchema = exports.createQaidaDailyReportSchema = void 0;
const zod_1 = require("zod");
const dayEntrySchema = zod_1.z.object({
    hadithNumber: zod_1.z.string().optional(),
    duaNumber: zod_1.z.string().optional(),
    tajweedSubject: zod_1.z.string().optional(),
    qaidaPage: zod_1.z.string().optional(),
    pageAmount: zod_1.z.string().optional(),
    hadithDuaRevision: zod_1.z.string().optional(),
    duaRevision: zod_1.z.string().optional(),
    tajweedRevision: zod_1.z.string().optional(),
    qaidaRevision: zod_1.z.string().optional(),
    teacherSignature: zod_1.z.string().optional(),
    comment: zod_1.z.string().optional(),
});
const dailyEntriesSchema = zod_1.z.object({
    saturday: dayEntrySchema,
    sunday: dayEntrySchema,
    monday: dayEntrySchema,
    tuesday: dayEntrySchema,
    wednesday: dayEntrySchema,
    thursday: dayEntrySchema,
    friday: dayEntrySchema,
});
exports.createQaidaDailyReportSchema = zod_1.z.object({
    body: zod_1.z.object({
        studentName: zod_1.z.string({ required_error: "Student name is required" }),
        reportDate: zod_1.z.string({ required_error: "Report date is required" }),
        month: zod_1.z.string({ required_error: "Month is required" }),
        weeklyTarget: zod_1.z.string().optional(),
        dailyEntries: dailyEntriesSchema,
    }),
});
exports.updateQaidaDailyReportSchema = zod_1.z.object({
    body: zod_1.z.object({
        studentName: zod_1.z.string().optional(),
        reportDate: zod_1.z.string().optional(),
        month: zod_1.z.string().optional(),
        weeklyTarget: zod_1.z.string().optional(),
        dailyEntries: dailyEntriesSchema.partial(),
    }),
});
