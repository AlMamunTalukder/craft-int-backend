"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AmparaDailyReportValidation = void 0;
const zod_1 = require("zod");
const DailyEntrySchema = zod_1.z.object({
    sobok: zod_1.z.object({
        para: zod_1.z.string().optional(),
        page: zod_1.z.string().optional(),
    }).optional(),
    sabakSeven: zod_1.z.object({
        para: zod_1.z.string().optional(),
        page: zod_1.z.string().optional(),
    }).optional(),
    sabakAmukta: zod_1.z.object({
        para: zod_1.z.string().optional(),
        page: zod_1.z.string().optional(),
    }).optional(),
    satSobok: zod_1.z.object({
        para: zod_1.z.string().optional(),
        page: zod_1.z.string().optional(),
        amount: zod_1.z.string().optional(),
        wrong: zod_1.z.string().optional(),
    }).optional(),
    tilawaAmount: zod_1.z.string().optional(),
    mashq: zod_1.z.string().optional(),
    tajweed: zod_1.z.string().optional(),
    teacherSignature: zod_1.z.string().optional(),
    thursdayWeeklyRevision: zod_1.z.string().optional(),
});
exports.AmparaDailyReportValidation = zod_1.z.object({
    body: zod_1.z.object({
        teacherName: zod_1.z.string().min(1, 'Teacher name is required'),
        studentName: zod_1.z.string().min(1, 'Student name is required'),
        reportDate: zod_1.z.string().min(1, 'Report date is required'),
        month: zod_1.z.string().min(1, 'Month is required'),
        weeklyTarget: zod_1.z.string().optional(),
        dailyEntries: zod_1.z.object({
            saturday: DailyEntrySchema,
            sunday: DailyEntrySchema,
            monday: DailyEntrySchema,
            tuesday: DailyEntrySchema,
            wednesday: DailyEntrySchema,
            thursday: DailyEntrySchema,
            friday: DailyEntrySchema,
        }),
    }),
});
