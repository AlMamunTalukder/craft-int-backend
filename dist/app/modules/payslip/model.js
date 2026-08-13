"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Payslip = void 0;
const mongoose_1 = require("mongoose");
const PayslipSchema = new mongoose_1.Schema({
    employeeType: { type: String, enum: ['teacher', 'staff'], required: true },
    employee: { type: mongoose_1.Schema.Types.ObjectId, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    year: { type: Number, required: true },
    salary: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Salary' },
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
}, { timestamps: true });
PayslipSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
PayslipSchema.index({ month: 1, year: 1, employeeType: 1 });
exports.Payslip = (0, mongoose_1.model)('Payslip', PayslipSchema);
