import { z } from 'zod';

const generatePayslipsValidation = z.object({
  body: z.object({
    month: z.number().min(1).max(12),
    year: z.number().min(2000).max(2100),
    employeeType: z.enum(['teacher', 'staff']),
  }),
});

export const payslipValidations = {
  generatePayslipsValidation,
};
