"use strict";
// src/validations/salary.validation.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.createSalarySchema = void 0;
const zod_1 = require("zod");
exports.createSalarySchema = zod_1.z.object({
    body: zod_1.z.object({
        employee: zod_1.z.string().optional(),
        basicSalary: zod_1.z.number().optional(),
        houseRent: zod_1.z.number().min(0).optional().default(0),
        medicalAllowance: zod_1.z.number().min(0).optional().default(0),
        transportAllowance: zod_1.z.number().min(0).optional().default(0),
        foodAllowance: zod_1.z.number().min(0).optional().default(0),
        otherAllowances: zod_1.z.number().min(0).optional().default(0),
        incomeTax: zod_1.z.number().min(0).optional().default(0),
        providentFund: zod_1.z.number().min(0).optional().default(0),
        otherDeductions: zod_1.z.number().min(0).optional().default(0),
        notes: zod_1.z.string().optional(),
    }),
});
