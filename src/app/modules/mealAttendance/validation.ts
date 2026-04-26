// mealAttendance/validation.ts
import { z } from 'zod';

const createAttendanceValidation = z.object({
  body: z.object({
    student: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID format'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    academicYear: z.string().regex(/^\d{4}$/, 'Academic year must be 4 digits'),
    breakfast: z.boolean().optional().default(false),
    lunch: z.boolean().optional().default(false),
    dinner: z.boolean().optional().default(false),
    isHoliday: z.boolean().optional().default(false),
    isAbsent: z.boolean().optional().default(false),
    remarks: z.string().optional(),
    mealRate: z.number().optional().default(55),
  }),
});

const bulkAttendanceValidation = z.object({
  body: z.object({
    attendances: z.array(z.object({
      studentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid student ID format'),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
      breakfast: z.boolean().optional().default(false),
      lunch: z.boolean().optional().default(false),
      dinner: z.boolean().optional().default(false),
    })).min(1, 'At least one attendance record is required'),
    academicYear: z.string().regex(/^\d{4}$/, 'Academic year must be 4 digits'),
  }),
});

export { createAttendanceValidation, bulkAttendanceValidation };