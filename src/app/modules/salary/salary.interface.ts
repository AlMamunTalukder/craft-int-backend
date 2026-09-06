

export interface ISalaryTransaction {
  kind: "bonus" | "advance" | "deducted" | "paid";
  amount: number;
  date?: string;
  reason?: string;
}

export interface ISalary {
  employee: string;
  employeeType?: string;
  effectiveDate: string;
  basicSalary: number;
  houseRent: number;
  medicalAllowance: number;
  transportAllowance: number;
  foodAllowance: number;
  otherAllowances: number;
  incomeTax: number;
  providentFund: number;
  otherDeductions: number;
  advanceGiven?: number;
  advanceDate?: string;
  paidAmount?: number;
  paidDate?: string;
  transactions?: ISalaryTransaction[];
  notes?: string;
  grossSalary: number;
  netSalary: number;
  allowances: number;
  deductions: number;
}
