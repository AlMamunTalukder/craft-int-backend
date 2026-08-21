"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Salary = void 0;
// src/models/salary.model.ts
const mongoose_1 = require("mongoose");
const SalarySchema = new mongoose_1.Schema({
    employee: {
        type: String,
        required: [true, "Employee ID is required"],
        trim: true,
        // ref: "Employee",
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
}, {
    timestamps: true,
});
exports.Salary = (0, mongoose_1.model)("Salary", SalarySchema);
