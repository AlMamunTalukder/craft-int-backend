"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routineValidations = void 0;
const zod_1 = require("zod");
const periodSchema = zod_1.z.object({
    subject: zod_1.z.string().min(1, 'Subject is required'),
    teacher: zod_1.z.string().optional(),
    startTime: zod_1.z.string().min(1, 'Start time is required'),
    endTime: zod_1.z.string().min(1, 'End time is required'),
    room: zod_1.z.string().optional(),
    isBreak: zod_1.z.boolean().optional(),
});
const createRoutineValidation = zod_1.z.object({
    body: zod_1.z.object({
        className: zod_1.z.string().min(1, 'Class is required'),
        section: zod_1.z.string().optional(),
        day: zod_1.z.string().min(1, 'Day is required'),
        academicYear: zod_1.z.string().min(1, 'Academic year is required'),
        periods: zod_1.z.array(periodSchema).default([]),
    }),
});
const updateRoutineValidation = zod_1.z.object({
    body: zod_1.z.object({
        className: zod_1.z.string().optional(),
        section: zod_1.z.string().optional(),
        day: zod_1.z.string().optional(),
        academicYear: zod_1.z.string().optional(),
        periods: zod_1.z.array(periodSchema).optional(),
    }),
});
exports.routineValidations = {
    createRoutineValidation,
    updateRoutineValidation,
};
