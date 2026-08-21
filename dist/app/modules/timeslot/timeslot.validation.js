"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeSlotValidations = void 0;
const zod_1 = require("zod");
const createTimeSlotValidation = zod_1.z.object({
    body: zod_1.z.object({
        startTime: zod_1.z
            .string({
            required_error: 'Start time is required',
        })
            .min(1, 'Start time must not be empty'),
        endTime: zod_1.z
            .string({
            required_error: 'End time is required',
        })
            .min(1, 'End time must not be empty'),
        day: zod_1.z
            .string({
            required_error: 'Day is required',
        })
            .min(1, 'Day must not be empty'),
        isActive: zod_1.z.boolean().optional(),
    }),
});
const updateTimeSlotValidation = zod_1.z.object({
    body: zod_1.z.object({
        startTime: zod_1.z.string().optional(),
        endTime: zod_1.z.string().optional(),
        day: zod_1.z.string().optional(),
        isActive: zod_1.z.boolean().optional(),
    }),
});
exports.TimeSlotValidations = {
    createTimeSlotValidation,
    updateTimeSlotValidation,
};
