"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payslipValidations = void 0;
const zod_1 = require("zod");
const generatePayslipsValidation = zod_1.z.object({
    body: zod_1.z.object({
        month: zod_1.z.number().min(1).max(12),
        year: zod_1.z.number().min(2000).max(2100),
        employeeType: zod_1.z.enum(['teacher', 'staff']),
    }),
});
exports.payslipValidations = {
    generatePayslipsValidation,
};
