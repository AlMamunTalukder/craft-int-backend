"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.feeAdjustmentServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const model_1 = require("./model");
const model_2 = require("../fees/model");
const mongoose_1 = __importStar(require("mongoose"));
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];
const monthToIndex = (monthStr) => {
    const [month, year] = monthStr.split('-');
    const monthIdx = MONTHS.indexOf(month);
    if (monthIdx === -1 || !year)
        return -1;
    return parseInt(year) * 12 + monthIdx;
};
const isMonthInRange = (feeMonth, startMonth, endMonth) => {
    const feeIdx = monthToIndex(feeMonth);
    const startIdx = monthToIndex(startMonth);
    const endIdx = monthToIndex(endMonth);
    if (feeIdx === -1 || startIdx === -1 || endIdx === -1)
        return false;
    return feeIdx >= startIdx && feeIdx <= endIdx;
};
const applyAdjustmentToFee = (feeId, adjustmentData, session) => __awaiter(void 0, void 0, void 0, function* () {
    const fee = yield model_2.Fees.findById(feeId).session(session);
    if (!fee)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Fee record not found');
    let adjustmentAmount = 0;
    if (adjustmentData.adjustmentType === 'percentage') {
        adjustmentAmount = (fee.amount * adjustmentData.value) / 100;
    }
    else {
        adjustmentAmount = adjustmentData.value;
    }
    if (adjustmentData.type === 'discount') {
        fee.discount = (fee.discount || 0) + adjustmentAmount;
    }
    else if (adjustmentData.type === 'waiver') {
        fee.waiver = (fee.waiver || 0) + adjustmentAmount;
    }
    const totalAdjustments = (fee.discount || 0) + (fee.waiver || 0);
    if (totalAdjustments > fee.amount) {
        const ratio = fee.amount / totalAdjustments;
        fee.discount = Math.round((fee.discount || 0) * ratio * 100) / 100;
        fee.waiver = Math.round((fee.waiver || 0) * ratio * 100) / 100;
    }
    fee.dueAmount = Math.max(0, fee.amount - fee.paidAmount - fee.advanceUsed - (fee.discount || 0) - (fee.waiver || 0));
    if (fee.dueAmount === 0)
        fee.status = 'paid';
    else if (fee.paidAmount + fee.advanceUsed > 0)
        fee.status = 'partial';
    else
        fee.status = 'unpaid';
    yield fee.save({ session });
    return { fee, adjustmentAmount };
});
const reverseAdjustmentFromFee = (feeId, adjustment, session) => __awaiter(void 0, void 0, void 0, function* () {
    const fee = yield model_2.Fees.findById(feeId).session(session);
    if (!fee)
        return;
    let adjustmentAmount = 0;
    if (adjustment.adjustmentType === 'percentage') {
        adjustmentAmount = (fee.amount * adjustment.value) / 100;
    }
    else {
        adjustmentAmount = adjustment.value;
    }
    if (adjustment.type === 'discount') {
        fee.discount = Math.max(0, (fee.discount || 0) - adjustmentAmount);
    }
    else if (adjustment.type === 'waiver') {
        fee.waiver = Math.max(0, (fee.waiver || 0) - adjustmentAmount);
    }
    fee.dueAmount = Math.max(0, fee.amount - fee.paidAmount - fee.advanceUsed - (fee.discount || 0) - (fee.waiver || 0));
    if (fee.dueAmount === 0)
        fee.status = 'paid';
    else if (fee.paidAmount + fee.advanceUsed > 0)
        fee.status = 'partial';
    else
        fee.status = 'unpaid';
    yield fee.save({ session });
    return { fee, adjustmentAmount };
});
const createFeeAdjustment = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        if (!payload.student)
            throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Student ID is required');
        if (!payload.fee)
            throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Fee ID is required');
        if (!payload.value || payload.value <= 0)
            throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Valid adjustment value is required');
        const feeExists = yield model_2.Fees.findById(payload.fee);
        if (!feeExists)
            throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Fee not found');
        const adjustmentData = Object.assign(Object.assign({}, payload), { type: payload.type || 'discount', adjustmentType: payload.adjustmentType || 'flat', reason: payload.reason || '', isActive: payload.isActive !== undefined ? payload.isActive : true, isRecurring: payload.isRecurring !== undefined ? payload.isRecurring : false, academicYear: payload.academicYear || new Date().getFullYear().toString(), startMonth: payload.startMonth || feeExists.month, endMonth: payload.endMonth || payload.startMonth || feeExists.month });
        const [adjustment] = yield model_1.FeeAdjustment.create([adjustmentData], { session });
        if (adjustmentData.isRecurring && adjustmentData.startMonth && adjustmentData.endMonth) {
            yield applyRecurringAdjustmentToRange(payload.student.toString(), adjustment, adjustmentData.startMonth, adjustmentData.endMonth, adjustmentData.academicYear, session);
        }
        else {
            yield applyAdjustmentToFee(payload.fee.toString(), adjustment, session);
        }
        yield session.commitTransaction();
        const populatedAdjustment = yield model_1.FeeAdjustment.findById(adjustment._id)
            .populate('student').populate('fee').populate('enrollment').populate('approvedBy');
        return populatedAdjustment;
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
const applyRecurringAdjustmentToRange = (studentId, adjustment, startMonth, endMonth, academicYear, session) => __awaiter(void 0, void 0, void 0, function* () {
    const feesInYear = yield model_2.Fees.find({
        student: new mongoose_1.Types.ObjectId(studentId),
        academicYear,
    }).session(session);
    const feesInRange = feesInYear.filter((fee) => fee.month ? isMonthInRange(fee.month, startMonth, endMonth) : false);
    let appliedCount = 0;
    for (const fee of feesInRange) {
        const perFeeAdjustment = Object.assign(Object.assign({}, adjustment.toObject()), { fee: fee._id });
        yield applyAdjustmentToFee(fee._id.toString(), perFeeAdjustment, session);
        appliedCount++;
    }
    return appliedCount;
});
// ─── Bulk adjustment (all unpaid fees for student) ───────────────────────────
const applyAdjustmentToStudentFees = (studentId, adjustmentData) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        if (!studentId)
            throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Student ID is required');
        const studentFees = yield model_2.Fees.find({
            student: new mongoose_1.Types.ObjectId(studentId),
            status: { $in: ['unpaid', 'partial'] },
        }).session(session);
        if (studentFees.length === 0)
            throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'No fees found for this student');
        const adjustments = [];
        for (const fee of studentFees) {
            let effectiveValue = adjustmentData.value || 0;
            if (adjustmentData.adjustmentType === 'flat') {
                effectiveValue = Math.min(effectiveValue, fee.dueAmount || 0);
            }
            if (effectiveValue <= 0)
                continue;
            const adjustmentPayload = {
                student: new mongoose_1.Types.ObjectId(studentId),
                fee: fee._id,
                type: adjustmentData.type || 'discount',
                adjustmentType: adjustmentData.adjustmentType || 'flat',
                value: effectiveValue,
                reason: adjustmentData.reason || 'Bulk adjustment',
                approvedBy: adjustmentData.approvedBy,
                approvedDate: adjustmentData.approvedDate || new Date(),
                startMonth: fee.month,
                endMonth: fee.month,
                academicYear: fee.academicYear,
                isActive: adjustmentData.isActive !== undefined ? adjustmentData.isActive : true,
                isRecurring: false, // bulk is never recurring
            };
            const [adjustment] = yield model_1.FeeAdjustment.create([adjustmentPayload], { session });
            yield applyAdjustmentToFee(fee._id.toString(), adjustment, session);
            adjustments.push(adjustment);
        }
        yield session.commitTransaction();
        return yield model_1.FeeAdjustment.find({ _id: { $in: adjustments.map((a) => a._id) } })
            .populate('student').populate('fee').populate('enrollment').populate('approvedBy');
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
// ─── Auto-apply recurring adjustments when a NEW fee record is created ───────
/**
 * Called from generateMonthlyFees / createSingleFee after each fee is created.
 * Finds all active recurring adjustments whose range covers this fee's month
 * and applies them automatically.
 */
const applyAutoAdjustments = (feeId, studentId, academicYear) => __awaiter(void 0, void 0, void 0, function* () {
    const fee = yield model_2.Fees.findById(feeId);
    if (!fee || !fee.month)
        return;
    // Find ALL active recurring adjustments for this student/year
    const activeAdjustments = yield model_1.FeeAdjustment.find({
        student: new mongoose_1.Types.ObjectId(studentId),
        academicYear,
        isActive: true,
        isRecurring: true,
    });
    if (activeAdjustments.length === 0)
        return;
    // Filter: only those whose [startMonth, endMonth] range covers this fee's month
    const applicable = activeAdjustments.filter((adj) => adj.startMonth && adj.endMonth
        ? isMonthInRange(fee.month, adj.startMonth, adj.endMonth)
        : false);
    if (applicable.length === 0)
        return;
    // Reset then re-apply all applicable adjustments cleanly
    fee.discount = 0;
    fee.waiver = 0;
    for (const adjustment of applicable) {
        let amount = 0;
        if (adjustment.adjustmentType === 'percentage') {
            amount = (fee.amount * adjustment.value) / 100;
        }
        else {
            amount = adjustment.value;
        }
        if (adjustment.type === 'discount')
            fee.discount = (fee.discount || 0) + amount;
        else if (adjustment.type === 'waiver')
            fee.waiver = (fee.waiver || 0) + amount;
    }
    // Cap
    const total = (fee.discount || 0) + (fee.waiver || 0);
    if (total > fee.amount) {
        const ratio = fee.amount / total;
        fee.discount = Math.round((fee.discount || 0) * ratio * 100) / 100;
        fee.waiver = Math.round((fee.waiver || 0) * ratio * 100) / 100;
    }
    fee.dueAmount = Math.max(0, fee.amount - fee.paidAmount - fee.advanceUsed - (fee.discount || 0) - (fee.waiver || 0));
    if (fee.dueAmount === 0)
        fee.status = 'paid';
    else if (fee.paidAmount + fee.advanceUsed > 0)
        fee.status = 'partial';
    else
        fee.status = 'unpaid';
    yield fee.save();
});
// ─── Validate before payment ──────────────────────────────────────────────────
const validateAdjustmentForPayment = (feeId, paymentAmount) => __awaiter(void 0, void 0, void 0, function* () {
    const fee = yield model_2.Fees.findById(feeId);
    if (!fee)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Fee record not found');
    const totalAdjustments = (fee.discount || 0) + (fee.waiver || 0);
    const netAmount = fee.amount - totalAdjustments;
    const remainingDue = Math.max(0, netAmount - fee.paidAmount - fee.advanceUsed);
    if (paymentAmount > remainingDue) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, `Payment amount (${paymentAmount}) exceeds due amount (${remainingDue})`);
    }
    return { fee, netAmount, remainingDue };
});
// ─── CRUD ────────────────────────────────────────────────────────────────────
const updateFeeAdjustment = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const existing = yield model_1.FeeAdjustment.findById(id).session(session);
        if (!existing)
            throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'FeeAdjustment not found');
        yield reverseAdjustmentFromFee(existing.fee.toString(), existing, session);
        Object.assign(existing, payload);
        existing.updatedAt = new Date();
        const updated = yield existing.save({ session });
        yield applyAdjustmentToFee(existing.fee.toString(), updated, session);
        yield session.commitTransaction();
        return yield model_1.FeeAdjustment.findById(id)
            .populate('student').populate('fee').populate('enrollment').populate('approvedBy');
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
const deleteFeeAdjustment = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const adjustment = yield model_1.FeeAdjustment.findById(id).session(session);
        if (!adjustment)
            throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'FeeAdjustment not found');
        yield reverseAdjustmentFromFee(adjustment.fee.toString(), adjustment, session);
        yield model_1.FeeAdjustment.findByIdAndDelete(id).session(session);
        yield session.commitTransaction();
        return adjustment;
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
const getStudentActiveAdjustments = (studentId, academicYear) => __awaiter(void 0, void 0, void 0, function* () {
    const query = { student: new mongoose_1.Types.ObjectId(studentId), isActive: true };
    if (academicYear)
        query.academicYear = academicYear;
    return model_1.FeeAdjustment.find(query)
        .populate('student').populate('fee').populate('enrollment').sort({ createdAt: -1 });
});
const getFeeReportWithAdjustments = (studentId, academicYear) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const fees = yield model_2.Fees.find({ student: new mongoose_1.Types.ObjectId(studentId), academicYear })
        .populate('student').populate('enrollment').sort({ month: 1 });
    const adjustments = yield model_1.FeeAdjustment.find({ student: new mongoose_1.Types.ObjectId(studentId), academicYear })
        .populate('fee').sort({ createdAt: -1 });
    const report = {
        student: ((_a = fees[0]) === null || _a === void 0 ? void 0 : _a.student) || null,
        fees: fees.map((fee) => {
            const feeAdjustments = adjustments.filter((adj) => adj.fee && adj.fee._id.toString() === fee._id.toString());
            const totalAdjustments = feeAdjustments.reduce((sum, adj) => {
                let amount = adj.value;
                if (adj.adjustmentType === 'percentage')
                    amount = (fee.amount * adj.value) / 100;
                return sum + amount;
            }, 0);
            return {
                _id: fee._id, month: fee.month, class: fee.class,
                originalAmount: fee.amount, adjustments: totalAdjustments,
                netAmount: fee.amount - totalAdjustments, paidAmount: fee.paidAmount,
                advanceUsed: fee.advanceUsed, dueAmount: fee.dueAmount,
                status: fee.status, adjustmentsDetail: feeAdjustments,
            };
        }),
        summary: {
            totalFees: fees.length,
            totalOriginalAmount: fees.reduce((s, f) => s + f.amount, 0),
            totalAdjustments: fees.reduce((s, f) => s + (f.discount || 0) + (f.waiver || 0), 0),
            totalPaid: fees.reduce((s, f) => s + (f.paidAmount || 0), 0),
            totalAdvanceUsed: fees.reduce((s, f) => s + (f.advanceUsed || 0), 0),
            totalDue: fees.reduce((s, f) => s + (f.dueAmount || 0), 0),
        },
    };
    return report;
});
const getAllFeeAdjustments = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.default(model_1.FeeAdjustment.find()
        .populate('student').populate('fee').populate('enrollment').populate('approvedBy'), query).search(['reason', 'type']).filter().sort().paginate().fields();
    const meta = yield queryBuilder.countTotal();
    const data = yield queryBuilder.modelQuery;
    return { meta, data };
});
const getSingleFeeAdjustment = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.FeeAdjustment.findById(id)
        .populate('student').populate('fee').populate('enrollment').populate('approvedBy');
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'FeeAdjustment not found');
    return result;
});
exports.feeAdjustmentServices = {
    createFeeAdjustment,
    getAllFeeAdjustments,
    getSingleFeeAdjustment,
    updateFeeAdjustment,
    deleteFeeAdjustment,
    applyAdjustmentToStudentFees,
    applyAutoAdjustments,
    validateAdjustmentForPayment,
    getStudentActiveAdjustments,
    getFeeReportWithAdjustments,
    applyAdjustmentToFee,
    reverseAdjustmentFromFee,
    applyRecurringAdjustmentToRange,
};
