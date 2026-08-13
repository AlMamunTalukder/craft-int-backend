"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvestmentValidations = void 0;
// investment/validation.ts
const zod_1 = require("zod");
const createInvestmentValidation = zod_1.z.object({
    body: zod_1.z.object({
        investmentCategory: zod_1.z.enum(['outgoing', 'incoming']),
        investmentTo: zod_1.z.string().optional(),
        investmentType: zod_1.z.string().optional(),
        investorName: zod_1.z.string().optional(),
        investorContact: zod_1.z.string().optional(),
        incomingType: zod_1.z.string().optional(),
        returnPolicy: zod_1.z.string().optional(),
        investmentAmount: zod_1.z.number().min(1),
        investmentDate: zod_1.z.string().optional(),
        maturityDate: zod_1.z.string().optional(),
        returnRate: zod_1.z.number().min(0).optional(),
    })
});
const updateInvestmentValidation = zod_1.z.object({
    body: zod_1.z.object({
        investmentCategory: zod_1.z.enum(['outgoing', 'incoming']).optional(),
        investmentTo: zod_1.z.string().optional(),
        investmentType: zod_1.z.string().optional(),
        investorName: zod_1.z.string().optional(),
        investorContact: zod_1.z.string().optional(),
        incomingType: zod_1.z.string().optional(),
        returnPolicy: zod_1.z.string().optional(),
        investmentAmount: zod_1.z.number().min(1).optional(),
        investmentDate: zod_1.z.string().optional(),
        maturityDate: zod_1.z.string().optional(),
        returnRate: zod_1.z.number().min(0).optional(),
        status: zod_1.z.enum(['active', 'closed', 'withdrawn', 'matured']).optional(),
    })
});
const addReturnValidation = zod_1.z.object({
    body: zod_1.z.object({
        date: zod_1.z.string().optional(),
        amount: zod_1.z.number().min(0),
        type: zod_1.z.enum(['interest', 'principal', 'dividend', 'capital_gain']),
        note: zod_1.z.string().optional(),
    })
});
exports.InvestmentValidations = {
    createInvestmentValidation,
    updateInvestmentValidation,
    addReturnValidation
};
