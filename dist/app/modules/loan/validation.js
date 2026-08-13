"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoanValidations = void 0;
// loan/validation.ts
const zod_1 = require("zod");
const createLoanValidation = zod_1.z.object({
    body: zod_1.z.object({
        loan_type: zod_1.z.enum(['taken', 'given']),
        lenderName: zod_1.z.string().optional(),
        borrowerName: zod_1.z.string(),
        contactNumber: zod_1.z.string(),
        loan_amount: zod_1.z.number().min(0),
        interest_rate: zod_1.z.number().min(0).optional(),
        loan_date: zod_1.z.string().optional(),
        repayment_start_date: zod_1.z.string().optional(),
        repayment_end_date: zod_1.z.string().optional(),
        monthly_installment: zod_1.z.number().min(0).optional(),
    })
});
const updateLoanValidation = zod_1.z.object({
    body: zod_1.z.object({
        loan_type: zod_1.z.enum(['taken', 'given']).optional(),
        lenderName: zod_1.z.string().optional(),
        borrowerName: zod_1.z.string().optional(),
        contactNumber: zod_1.z.string().optional(),
        loan_amount: zod_1.z.number().min(0).optional(),
        interest_rate: zod_1.z.number().min(0).optional(),
        loan_date: zod_1.z.string().optional(),
        repayment_start_date: zod_1.z.string().optional(),
        repayment_end_date: zod_1.z.string().optional(),
        monthly_installment: zod_1.z.number().min(0).optional(),
        status: zod_1.z.enum(['active', 'paid', 'defaulted', 'overdue']).optional(),
    })
});
const addRepaymentValidation = zod_1.z.object({
    body: zod_1.z.object({
        date: zod_1.z.string(),
        amount: zod_1.z.number().min(0),
        type: zod_1.z.enum(['principal', 'interest', 'penalty']),
        note: zod_1.z.string().optional(),
    })
});
const transferLoanValidation = zod_1.z.object({
    body: zod_1.z.object({
        lenderName: zod_1.z.string().optional(),
        borrowerName: zod_1.z.string().optional(),
        contactNumber: zod_1.z.string().optional(),
        interest_rate: zod_1.z.number().min(0).optional(),
        repayment_end_date: zod_1.z.string().optional(),
    })
});
exports.LoanValidations = {
    createLoanValidation,
    updateLoanValidation,
    addRepaymentValidation,
    transferLoanValidation
};
