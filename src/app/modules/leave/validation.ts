import { z } from 'zod';

const createLeaveValidation = z.object({
  body: z.object({
    employeeType: z.enum(['teacher', 'staff']),
    employee: z.string().min(1, 'Employee is required'),
    leaveType: z.string().min(1, 'Leave type is required'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
    reason: z.string().optional(),
  }),
});

const updateLeaveValidation = z.object({
  body: z.object({
    employeeType: z.enum(['teacher', 'staff']).optional(),
    employee: z.string().optional(),
    leaveType: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    reason: z.string().optional(),
  }),
});

const updateLeaveStatusValidation = z.object({
  body: z.object({
    status: z.enum(['pending', 'approved', 'rejected']),
  }),
});

export const leaveValidations = {
  createLeaveValidation,
  updateLeaveValidation,
  updateLeaveStatusValidation,
};
