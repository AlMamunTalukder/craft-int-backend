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
exports.investmentServices = void 0;
// investment/services.ts
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const model_1 = require("./model");
const createInvestment = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Validate that maturity date is after investment date
    if (payload.maturityDate && payload.investmentDate) {
        const investmentDate = new Date(payload.investmentDate);
        const maturityDate = new Date(payload.maturityDate);
        if (maturityDate <= investmentDate) {
            throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Maturity date must be after investment date');
        }
    }
    // Validate return rate is not negative
    if (payload.returnRate && payload.returnRate < 0) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Return rate cannot be negative');
    }
    const result = yield model_1.Investment.create(payload);
    return result;
});
const getAllInvestments = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.default(model_1.Investment.find(), query)
        .search(['investmentTo', 'investorName', 'investmentType', 'incomingType'])
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const investments = yield queryBuilder.modelQuery;
    return { meta, investments };
});
const getSingleInvestment = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Investment.findById(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Investment not found');
    }
    return result;
});
const updateInvestment = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Prevent updating certain fields if investment is closed
    const existingInvestment = yield model_1.Investment.findById(id);
    if (!existingInvestment) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Investment not found');
    }
    if (existingInvestment.status === 'closed' || existingInvestment.status === 'matured') {
        // Don't allow updating amount, dates, or rate for closed/matured investments
        const restrictedFields = ['investmentAmount', 'investmentDate', 'maturityDate', 'returnRate'];
        const hasRestrictedField = Object.keys(payload).some(field => restrictedFields.includes(field));
        if (hasRestrictedField) {
            throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Cannot update amount, dates, or rate for closed/matured investments');
        }
    }
    const result = yield model_1.Investment.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update investment');
    }
    return result;
});
const deleteInvestment = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const investment = yield model_1.Investment.findById(id);
    if (!investment) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Investment not found');
    }
    // Prevent deletion of investments with returns
    if (investment.returnHistory && investment.returnHistory.length > 0) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Cannot delete investment with return history. Close it instead.');
    }
    const result = yield model_1.Investment.findByIdAndDelete(id);
    return result;
});
const addInvestmentReturn = (id, returnData) => __awaiter(void 0, void 0, void 0, function* () {
    const investment = yield model_1.Investment.findById(id);
    if (!investment) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Investment not found');
    }
    // Check if investment is closed or matured
    if (investment.status === 'closed' || investment.status === 'matured') {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Cannot add returns to closed or matured investments');
    }
    // Validate return amount
    if (returnData.amount <= 0) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Return amount must be greater than zero');
    }
    // Validate return date is not in the future
    const returnDate = new Date(returnData.date);
    if (returnDate > new Date()) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Return date cannot be in the future');
    }
    // Validate return date is not before investment date
    const investmentDate = new Date(investment.investmentDate);
    if (returnDate < investmentDate) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Return date cannot be before investment date');
    }
    // Initialize returnHistory if it doesn't exist
    if (!investment.returnHistory) {
        investment.returnHistory = [];
    }
    // Add the return to history
    investment.returnHistory.push(returnData);
    // Recalculate all values by saving (pre-save middleware will handle calculations)
    yield investment.save();
    return investment;
});
const closeInvestment = (id, finalReturn) => __awaiter(void 0, void 0, void 0, function* () {
    const investment = yield model_1.Investment.findById(id);
    if (!investment) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Investment not found');
    }
    // Check if investment is already closed
    if (investment.status === 'closed') {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Investment is already closed');
    }
    // If maturity date is in the future, warn user but allow closing
    if (investment.maturityDate && new Date(investment.maturityDate) > new Date()) {
        // Just a warning, not an error - user might want to close early
        console.warn('Closing investment before maturity date');
    }
    if (finalReturn) {
        if (finalReturn.amount <= 0) {
            throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Final return amount must be greater than zero');
        }
        // Initialize returnHistory if it doesn't exist
        if (!investment.returnHistory) {
            investment.returnHistory = [];
        }
        investment.returnHistory.push(finalReturn);
    }
    investment.status = 'closed';
    investment.closedDate = new Date();
    yield investment.save();
    return investment;
});
const calculateInvestmentPerformance = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const investment = yield model_1.Investment.findById(id);
    if (!investment) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Investment not found');
    }
    // This will trigger the pre-save middleware to recalculate all values
    yield investment.save();
    // Calculate additional performance metrics
    const totalInvested = investment.investmentAmount;
    const currentValue = investment.currentValue;
    const totalReturns = investment.totalReturns;
    const roi = investment.roi;
    const annualizedReturn = investment.annualizedReturn;
    const daysHeld = investment.daysHeld;
    // Calculate expected vs actual returns if returnRate is set
    let expectedReturns = 0;
    let performanceVsExpectation = 0;
    if (investment.returnRate && investment.returnRate > 0) {
        const yearsHeld = daysHeld / 365;
        expectedReturns = totalInvested * (investment.returnRate / 100) * yearsHeld;
        performanceVsExpectation = totalReturns - expectedReturns;
    }
    return {
        totalInvested,
        currentValue,
        totalReturns,
        roi,
        annualizedReturn,
        daysHeld,
        expectedReturns,
        performanceVsExpectation,
        status: investment.status,
        returnRate: investment.returnRate
    };
});
// New function to get investment summary
const getInvestmentSummary = () => __awaiter(void 0, void 0, void 0, function* () {
    const investments = yield model_1.Investment.find({});
    const summary = {
        totalInvestments: investments.length,
        totalInvestedAmount: 0,
        totalCurrentValue: 0,
        totalReturns: 0,
        byCategory: {
            outgoing: { count: 0, amount: 0, returns: 0 },
            incoming: { count: 0, amount: 0, returns: 0 }
        },
        byStatus: {
            active: { count: 0, amount: 0 },
            closed: { count: 0, amount: 0 },
            matured: { count: 0, amount: 0 },
            withdrawn: { count: 0, amount: 0 }
        },
        byType: {}
    };
    investments.forEach(investment => {
        summary.totalInvestedAmount += investment.investmentAmount;
        summary.totalCurrentValue += investment.currentValue || investment.investmentAmount;
        summary.totalReturns += investment.totalReturns || 0;
        // Count by category
        if (investment.investmentCategory === 'outgoing') {
            summary.byCategory.outgoing.count += 1;
            summary.byCategory.outgoing.amount += investment.investmentAmount;
            summary.byCategory.outgoing.returns += investment.totalReturns || 0;
        }
        else {
            summary.byCategory.incoming.count += 1;
            summary.byCategory.incoming.amount += investment.investmentAmount;
            summary.byCategory.incoming.returns += investment.totalReturns || 0;
        }
        // Count by status
        const status = investment.status || 'active';
        if (!summary.byStatus[status]) {
            summary.byStatus[status] = { count: 0, amount: 0 };
        }
        summary.byStatus[status].count += 1;
        summary.byStatus[status].amount += investment.investmentAmount;
        // Count by type
        const type = investment.investmentCategory === 'outgoing'
            ? investment.investmentType
            : investment.incomingType;
        if (type) {
            if (!summary.byType[type]) {
                summary.byType[type] = { count: 0, amount: 0 };
            }
            summary.byType[type].count += 1;
            summary.byType[type].amount += investment.investmentAmount;
        }
    });
    return summary;
});
// New function to get upcoming maturities
const getUpcomingMaturities = (...args_1) => __awaiter(void 0, [...args_1], void 0, function* (days = 30) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);
    const investments = yield model_1.Investment.find({
        maturityDate: {
            $gte: today,
            $lte: futureDate
        },
        status: 'active'
    }).sort({ maturityDate: 1 });
    return investments;
});
exports.investmentServices = {
    createInvestment,
    getAllInvestments,
    getSingleInvestment,
    updateInvestment,
    deleteInvestment,
    addInvestmentReturn,
    closeInvestment,
    calculateInvestmentPerformance,
    getInvestmentSummary,
    getUpcomingMaturities
};
