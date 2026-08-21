import { Schema, model } from 'mongoose';
import { IPayslip } from './interface';

const PayslipSchema = new Schema<IPayslip>(
  {
    employeeType: { type: String, enum: ['teacher', 'staff'], required: true },
    employee: { type: Schema.Types.ObjectId, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    salary: { type: Schema.Types.ObjectId, ref: 'Salary' },
    basicSalary: { type: Number, default: 0 },
    houseRent: { type: Number, default: 0 },
    medicalAllowance: { type: Number, default: 0 },
    transportAllowance: { type: Number, default: 0 },
    foodAllowance: { type: Number, default: 0 },
    otherAllowances: { type: Number, default: 0 },
    grossSalary: { type: Number, default: 0 },
    deductions: { type: Number, default: 0 },
    incomeTax: { type: Number, default: 0 },
    providentFund: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 },
    totalDeductions: { type: Number, default: 0 },
    netSalary: { type: Number, default: 0 },
    status: { type: String, enum: ['draft', 'paid'], default: 'draft' },
    paidAt: { type: Date },
  },
  { timestamps: true }
);

PayslipSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
PayslipSchema.index({ month: 1, year: 1, employeeType: 1 });

export const Payslip = model<IPayslip>('Payslip', PayslipSchema);
