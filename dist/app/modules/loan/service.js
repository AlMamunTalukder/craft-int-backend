"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loanServices = void 0;
// loan/services.ts
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const model_1 = require("./model");
const createLoan = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Loan.create(payload);
    return result;
});
const getAllLoans = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.default(model_1.Loan.find(), query)
        .search(['lenderName', 'borrowerName'])
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const data = yield queryBuilder.modelQuery;
    return { meta, data };
});
const getSingleLoan = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Loan.findById(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Loan not found');
    }
    return result;
});
const updateLoan = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Loan.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update loan');
    }
    return result;
});
const deleteLoan = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Loan.findByIdAndDelete(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Loan not found or already deleted');
    }
    return result;
});
const addRepayment = (id, repaymentData) => __awaiter(void 0, void 0, void 0, function* () {
    const loan = yield model_1.Loan.findById(id);
    if (!loan) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Loan not found');
    }
    const remainingBefore = loan.remainingBalance;
    if (repaymentData.amount > loan.remainingBalance) {
        throw new AppError_1.AppError(http_status_1.default.FORBIDDEN, 'Repayment amount exceeds remaining balance');
    }
    repaymentData.remainingBalance =
        remainingBefore -
            (repaymentData.type === 'principal' ? repaymentData.amount : 0);
    loan.repaymentHistory.push(repaymentData);
    yield loan.save();
    return loan;
});
const transferLoan = (originalLoanId, newLoanData) => __awaiter(void 0, void 0, void 0, function* () {
    // Get the original loan
    const originalLoan = yield model_1.Loan.findById(originalLoanId);
    if (!originalLoan || originalLoan.loan_type !== 'taken') {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Invalid original loan');
    }
    if (originalLoan.remainingBalance <= 0) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Original loan has no remaining balance to transfer');
    }
    // Create a new loan given
    const newLoan = yield model_1.Loan.create(Object.assign(Object.assign({}, newLoanData), { loan_type: 'given', loan_amount: originalLoan.remainingBalance, originalLoan: originalLoanId }));
    // Initialize fundedLoans if it doesn't exist
    if (!originalLoan.fundedLoans) {
        originalLoan.fundedLoans = [];
    }
    // Update original loan to reference this new loan
    originalLoan.fundedLoans.push(newLoan._id);
    yield originalLoan.save();
    return newLoan;
});
const calculateLoanAmortization = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const loan = yield model_1.Loan.findById(id);
    if (!loan)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Loan not found");
    if (!loan.repayment_start_date || !loan.repayment_end_date || !loan.interest_rate) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, "Missing required fields for amortization calculation");
    }
    const amortizationSchedule = [];
    let balance = loan.loan_amount;
    const monthlyRate = loan.interest_rate / 100 / 12;
    // Ensure repayment_end_date is after repayment_start_date
    const start = loan.repayment_start_date;
    const end = loan.repayment_end_date > start ? loan.repayment_end_date : start;
    const months = Math.ceil((end.getTime() - start.getTime()) / (30 * 24 * 60 * 60 * 1000));
    if (months <= 0) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, "Repayment end date must be after start date");
    }
    const monthlyPayment = loan.monthly_installment ||
        (loan.loan_amount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
            (Math.pow(1 + monthlyRate, months) - 1);
    for (let i = 0; i < months; i++) {
        const paymentDate = new Date(start);
        paymentDate.setMonth(paymentDate.getMonth() + i);
        const interest = balance * monthlyRate;
        const principal = monthlyPayment - interest;
        if (balance < principal) {
            amortizationSchedule.push({
                date: paymentDate,
                payment: balance + interest,
                principal: balance,
                interest,
                balance: 0,
            });
            break;
        }
        balance -= principal;
        amortizationSchedule.push({
            date: paymentDate,
            payment: monthlyPayment,
            principal,
            interest,
            balance,
        });
    }
    return {
        amortizationSchedule,
        totalInterest: amortizationSchedule.reduce((sum, p) => sum + p.interest, 0),
        totalPayment: amortizationSchedule.reduce((sum, p) => sum + p.payment, 0),
    };
});
exports.loanServices = {
    createLoan,
    getAllLoans,
    getSingleLoan,
    updateLoan,
    deleteLoan,
    addRepayment,
    transferLoan,
    calculateLoanAmortization,
};
