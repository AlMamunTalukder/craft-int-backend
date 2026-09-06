// src/models/salary.model.ts
import { Schema, model } from "mongoose";
import { ISalary } from "./salary.interface";

const SalarySchema = new Schema<ISalary>(
  {
    employee: {
      type: String,
      required: [true, "Employee ID is required"],
      trim: true,
      // ref: "Employee",
    },
    employeeType: {
      type: String,
      trim: true,
      default: "teacher",
    },
    effectiveDate: {
      type: String,
      required: [true, "Effective date is required"],
    },
    basicSalary: {
      type: Number,
      required: [true, "Basic salary is required"],
      min: [0, "Basic salary cannot be negative"],
    },
    houseRent: { 
      type: Number, 
      required: [true, "House rent is required"], 
      min: [0, "House rent cannot be negative"] 
    },
    medicalAllowance: { 
      type: Number, 
      required: [true, "Medical allowance is required"], 
      min: [0, "Medical allowance cannot be negative"] 
    },
    transportAllowance: { 
      type: Number, 
      required: [true, "Transport allowance is required"], 
      min: [0, "Transport allowance cannot be negative"] 
    },
    foodAllowance: { 
      type: Number, 
      required: [true, "Food allowance is required"], 
      min: [0, "Food allowance cannot be negative"] 
    },
    deductions: { 
      type: Number,
    },
    allowances: { 
      type: Number,
    },
    otherAllowances: { 
      type: Number, 
      required: [true, "Other allowances are required"], 
      min: [0, "Other allowances cannot be negative"] 
    },
    incomeTax: { 
      type: Number, 
      required: [true, "Income tax is required"], 
      min: [0, "Income tax cannot be negative"] 
    },
    providentFund: { 
      type: Number, 
      required: [true, "Provident fund is required"], 
      min: [0, "Provident fund cannot be negative"] 
    },
    otherDeductions: { 
      type: Number, 
      required: [true, "Other deductions are required"], 
      min: [0, "Other deductions cannot be negative"] 
    },
    notes: { 
      type: String, 
      trim: true, 
      required: [true, "Notes are required"] 
    },

    grossSalary: { 
      type: Number, 
      required: [true, "Gross salary is required"], 
      min: [0, "Gross salary cannot be negative"] 
    },
    netSalary: { 
      type: Number
    },
    advanceGiven: {
      type: Number,
      default: 0,
      min: [0, "Advance cannot be negative"],
    },
    advanceDate: {
      type: String,
      trim: true,
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, "Paid amount cannot be negative"],
    },
    paidDate: {
      type: String,
      trim: true,
    },
    // Per-entry ledger: bonus / advance / deducted / paid can each happen
    // many times in one month — every dialog appends one entry here
    transactions: {
      type: [
        {
          kind: {
            type: String,
            required: true,
            enum: ["bonus", "advance", "deducted", "paid"],
          },
          amount: { type: Number, required: true, min: 0 },
          date: { type: String },
          reason: { type: String, trim: true },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Salary = model<ISalary>("Salary", SalarySchema);
