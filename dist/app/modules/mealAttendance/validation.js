"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAttendanceValidation = exports.bulkAttendanceValidation = exports.createAttendanceValidation = void 0;
const zod_1 = require("zod");
const createAttendanceValidation = zod_1.z.object({
    body: zod_1.z.object({
        student: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID format'),
        date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
        academicYear: zod_1.z.string().regex(/^\d{4}$/, 'Academic year must be 4 digits (e.g., 2026)'),
        breakfast: zod_1.z.boolean().optional().default(false),
        lunch: zod_1.z.boolean().optional().default(false),
        dinner: zod_1.z.boolean().optional().default(false),
        isHoliday: zod_1.z.boolean().optional().default(false),
        isAbsent: zod_1.z.boolean().optional().default(false),
        remarks: zod_1.z.string().optional(),
        mealRate: zod_1.z.number().optional().default(55),
    }),
});
exports.createAttendanceValidation = createAttendanceValidation;
const bulkAttendanceValidation = zod_1.z.object({
    body: zod_1.z.object({
        attendances: zod_1.z.array(zod_1.z.object({
            studentId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID format'),
            date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
            breakfast: zod_1.z.boolean().optional().default(false),
            lunch: zod_1.z.boolean().optional().default(false),
            dinner: zod_1.z.boolean().optional().default(false),
        })).min(1, 'At least one attendance record is required'),
        academicYear: zod_1.z.string().regex(/^\d{4}$/, 'Academic year must be 4 digits (e.g., 2026)'),
    }),
});
exports.bulkAttendanceValidation = bulkAttendanceValidation;
const updateAttendanceValidation = zod_1.z.object({
    body: zod_1.z.object({
        student: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID format').optional(),
        date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
        academicYear: zod_1.z.string().regex(/^\d{4}$/, 'Academic year must be 4 digits (e.g., 2026)').optional(),
        breakfast: zod_1.z.boolean().optional(),
        lunch: zod_1.z.boolean().optional(),
        dinner: zod_1.z.boolean().optional(),
        isHoliday: zod_1.z.boolean().optional(),
        isAbsent: zod_1.z.boolean().optional(),
        remarks: zod_1.z.string().optional(),
        mealRate: zod_1.z.number().optional(),
    }),
});
exports.updateAttendanceValidation = updateAttendanceValidation;
