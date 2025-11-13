import { z } from "zod";

export const FeeAdjustmentValidation = z.object({
  student: z.string().min(1, "Student ID is required"),
  fee: z.string().min(1, "Fee ID is required"),
  type: z.enum(["discount", "waiver"]),
  amount: z.number().positive("Amount must be greater than 0"),
  reason: z.string().optional(),
  approvedBy: z.string().optional(),
  approvedDate: z.date().optional(),
  startMonth: z.string().optional(),
  endMonth: z.string().optional(),
});

export const createFeeAdjustmentValidation = FeeAdjustmentValidation;
export const updateFeeAdjustmentValidation = FeeAdjustmentValidation.partial();
