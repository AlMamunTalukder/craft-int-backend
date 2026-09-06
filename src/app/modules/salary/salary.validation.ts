// src/validations/salary.validation.ts

import { z } from 'zod';
export const createSalarySchema = z.object({
  body: z.object({
    employee: z.string().optional(),
    employeeType: z.string().optional(),
    basicSalary: z.number().optional(),
    houseRent: z.number().min(0).optional().default(0),
    medicalAllowance: z.number().min(0).optional().default(0),
    transportAllowance: z.number().min(0).optional().default(0),
    foodAllowance: z.number().min(0).optional().default(0),
    otherAllowances: z.number().min(0).optional().default(0),
    incomeTax: z.number().min(0).optional().default(0),
    providentFund: z.number().min(0).optional().default(0),
    otherDeductions: z.number().min(0).optional().default(0),
    advanceGiven: z.number().min(0).optional().default(0),
    advanceDate: z.string().optional(),
    paidAmount: z.number().min(0).optional().default(0),
    paidDate: z.string().optional(),
    transactions: z
      .array(
        z.object({
          kind: z.enum(["bonus", "advance", "deducted", "paid"]),
          amount: z.number().min(0),
          date: z.string().optional(),
          reason: z.string().optional(),
        })
      )
      .optional(),
    notes: z.string().optional(),
  }),
});
