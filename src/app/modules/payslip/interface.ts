import { ObjectId } from 'mongoose';

export interface IPayslip {
  employeeType: 'teacher' | 'staff';
  employee: ObjectId;
  month: number;
  year: number;
  salary: ObjectId;
  basicSalary: number;
  houseRent: number;
  medicalAllowance: number;
  transportAllowance: number;
  foodAllowance: number;
  otherAllowances: number;
  grossSalary: number;
  deductions: number;
  incomeTax: number;
  providentFund: number;
  otherDeductions: number;
  totalDeductions: number;
  netSalary: number;
  status: 'draft' | 'paid';
  paidAt?: Date;
}
