"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leaveValidations = void 0;
const zod_1 = require("zod");
const createLeaveValidation = zod_1.z.object({
    body: zod_1.z.object({
        employeeType: zod_1.z.enum(['teacher', 'staff']),
        employee: zod_1.z.string().min(1, 'Employee is required'),
        leaveType: zod_1.z.string().min(1, 'Leave type is required'),
        startDate: zod_1.z.string().min(1, 'Start date is required'),
        endDate: zod_1.z.string().min(1, 'End date is required'),
        reason: zod_1.z.string().optional(),
    }),
});
const updateLeaveValidation = zod_1.z.object({
    body: zod_1.z.object({
        employeeType: zod_1.z.enum(['teacher', 'staff']).optional(),
        employee: zod_1.z.string().optional(),
        leaveType: zod_1.z.string().optional(),
        startDate: zod_1.z.string().optional(),
        endDate: zod_1.z.string().optional(),
        reason: zod_1.z.string().optional(),
    }),
});
const updateLeaveStatusValidation = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(['pending', 'approved', 'rejected']),
    }),
});
exports.leaveValidations = {
    createLeaveValidation,
    updateLeaveValidation,
    updateLeaveStatusValidation,
};
