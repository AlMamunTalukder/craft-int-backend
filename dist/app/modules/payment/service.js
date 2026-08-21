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
exports.paymentServices = exports.getSinglePayment = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const model_1 = require("./model");
const mongoose_1 = __importDefault(require("mongoose"));
const model_2 = require("../fees/model");
const student_model_1 = require("../student/student.model");
const model_3 = require("../receipt/model");
const numberToWords_1 = require("../../../utils/numberToWords");
const createPayment = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Payment.create(payload);
    return result;
});
const getAllPayments = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.default(model_1.Payment.find(), query)
        .search(['name'])
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const data = yield queryBuilder.modelQuery;
    return { meta, data };
});
const getSinglePayment = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Payment.findById(id)
        .populate({
        path: 'student',
        select: 'name studentId class roll',
    })
        .populate({
        path: 'fees',
        select: 'title amount',
    })
        .populate({
        path: 'receiptData.feeDetails.className',
        select: 'name section',
    })
        .populate({
        path: 'receiptData.feeDetails',
        select: 'title amount',
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Payment not found');
    }
    return result;
});
exports.getSinglePayment = getSinglePayment;
const updatePayment = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Payment.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update payment');
    }
    return result;
});
const deletePayment = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Payment.findByIdAndDelete(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Payment not found or already deleted');
    }
    return result;
});
const createBulkPayment = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // Check if student exists
        const student = yield student_model_1.Student.findById(payload.studentId).session(session);
        if (!student) {
            throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Student not found');
        }
        // Check if fees exist
        const fees = yield model_2.Fees.find({ _id: { $in: payload.feeIds } }).session(session);
        if (fees.length === 0) {
            throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'No fees selected');
        }
        if (fees.length !== payload.feeIds.length) {
            throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Some fees not found');
        }
        // Verify all fees belong to the same student
        for (const fee of fees) {
            if (fee.student.toString() !== payload.studentId) {
                throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, `Fee ${fee._id} does not belong to student ${payload.studentId}`);
            }
        }
        // Calculate total due amount
        let totalDue = 0;
        const feeDetails = [];
        for (const fee of fees) {
            const netAmount = fee.amount - (fee.discount || 0) - (fee.waiver || 0);
            const dueAmount = netAmount - (fee.paidAmount || 0);
            if (dueAmount > 0) {
                totalDue += dueAmount;
            }
            feeDetails.push({
                feeId: fee._id,
                feeType: fee.feeType || 'General Fee',
                month: fee.month,
                originalAmount: fee.amount,
                discount: fee.discount || 0,
                waiver: fee.waiver || 0,
                netAmount,
                previousPaid: fee.paidAmount || 0,
                currentDue: Math.max(0, dueAmount),
                status: fee.status,
            });
        }
        // Validate payment amount
        if (payload.amountPaid > totalDue) {
            throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, `Payment amount (${payload.amountPaid}) exceeds total due (${totalDue})`);
        }
        if (payload.amountPaid <= 0) {
            throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Payment amount must be greater than 0');
        }
        const receiptNo = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const paymentData = {
            student: payload.studentId,
            fees: payload.feeIds,
            totalAmount: payload.amountPaid,
            paymentMethod: payload.paymentMethod,
            transactionId: payload.transactionId,
            note: payload.note,
            collectedBy: payload.collectedBy,
            receiptNo: receiptNo,
            receiptType: 'bulk',
            paymentDate: new Date(),
            receiptData: {
                studentName: student.name,
                studentId: student.studentId,
                className: student.className || 'N/A',
                feeDetails,
                paymentDetails: {
                    amountPaid: payload.amountPaid,
                    paymentMethod: payload.paymentMethod,
                    transactionId: payload.transactionId,
                    date: new Date(),
                },
            },
        };
        const payment = yield model_1.Payment.create([paymentData], { session });
        // Update each fee's paidAmount and status
        let remainingAmount = payload.amountPaid;
        for (const fee of fees) {
            const netAmount = fee.amount - (fee.discount || 0) - (fee.waiver || 0);
            const currentDue = netAmount - (fee.paidAmount || 0);
            if (currentDue > 0 && remainingAmount > 0) {
                const amountToPay = Math.min(currentDue, remainingAmount);
                const newPaidAmount = (fee.paidAmount || 0) + amountToPay;
                const newDueAmount = netAmount - newPaidAmount;
                // Determine new status
                let newStatus = 'unpaid';
                if (newPaidAmount >= netAmount) {
                    newStatus = 'paid';
                }
                else if (newPaidAmount > 0) {
                    newStatus = 'partial';
                }
                yield model_2.Fees.findByIdAndUpdate(fee._id, {
                    paidAmount: newPaidAmount,
                    dueAmount: newDueAmount,
                    status: newStatus,
                    paymentDate: new Date(),
                    paymentMethod: payload.paymentMethod,
                    receiptNo: receiptNo,
                    transactionId: payload.transactionId,
                }, { session, new: true });
                remainingAmount -= amountToPay;
            }
        }
        if (remainingAmount > 0) {
            yield student_model_1.Student.findByIdAndUpdate(payload.studentId, { $inc: { advanceBalance: remainingAmount } }, { session });
        }
        // Calculate summary values
        const subtotal = feeDetails.reduce((sum, fee) => sum + fee.originalAmount, 0);
        const totalDiscount = feeDetails.reduce((sum, fee) => sum + (fee.discount || 0), 0);
        const totalWaiver = feeDetails.reduce((sum, fee) => sum + (fee.waiver || 0), 0);
        const totalNetAmount = feeDetails.reduce((sum, fee) => sum + fee.netAmount, 0);
        const amountPaid = payload.amountPaid;
        const receiptDataForReceiptModel = {
            receiptNo: receiptNo,
            student: payload.studentId,
            studentName: student.name,
            studentId: student.studentId,
            className: typeof student.className === 'string'
                ? student.className
                : ((_b = (_a = student.className) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.className) || 'N/A',
            paymentId: payment[0]._id,
            totalAmount: payload.amountPaid,
            paymentMethod: payload.paymentMethod,
            paymentDate: new Date(),
            collectedBy: payload.collectedBy,
            transactionId: payload.transactionId,
            note: payload.note,
            fees: feeDetails.map((fee) => ({
                feeType: fee.feeType,
                month: fee.month,
                originalAmount: fee.originalAmount,
                discount: fee.discount || 0,
                waiver: fee.waiver || 0,
                netAmount: fee.netAmount,
                paidAmount: fee.currentDue,
            })),
            summary: {
                totalItems: feeDetails.length,
                subtotal: subtotal,
                totalDiscount: totalDiscount,
                totalWaiver: totalWaiver,
                totalNetAmount: totalNetAmount,
                amountPaid: amountPaid,
                subtotalWord: (0, numberToWords_1.numberToWords)(subtotal),
                totalNetAmountWord: (0, numberToWords_1.numberToWords)(totalNetAmount),
                amountPaidWord: (0, numberToWords_1.numberToWords)(amountPaid)
            },
            institute: {
                name: 'Craft International Institute',
                address: '123 Education Street, Dhaka, Bangladesh',
                phone: '+880 1300-726000',
                mobile: '+880 1830-678383',
                email: 'info@craftinstitute.edu.bd',
                website: 'www.craftinstitute.edu.bd',
            },
            status: 'active',
        };
        const receipt = yield model_3.Receipt.create([receiptDataForReceiptModel], {
            session,
        });
        yield student_model_1.Student.findByIdAndUpdate(payload.studentId, {
            $push: {
                payments: payment[0]._id,
                receipts: receipt[0]._id,
            },
        }, { session });
        yield session.commitTransaction();
        session.endSession();
        // Get populated payment data
        const populatedPayment = yield model_1.Payment.findById(payment[0]._id)
            .populate('student', 'name studentId className email phone')
            .populate({
            path: 'fees',
            select: 'feeType month amount discount waiver paidAmount dueAmount status paymentDate',
        })
            .lean();
        // রিসিট ডেটাও ফেরত দিন
        const populatedReceipt = yield model_3.Receipt.findById(receipt[0]._id).lean();
        return {
            success: true,
            message: 'Bulk payment processed successfully',
            data: {
                payment: populatedPayment,
                receipt: populatedReceipt, // ✅ রিসিট ডেটা যোগ করুন
            },
            receiptNo,
        };
    }
    catch (error) {
        yield session.abortTransaction();
        session.endSession();
        // Handle duplicate key error
        if (error.code === 11000) {
            throw new AppError_1.AppError(http_status_1.default.CONFLICT, 'Receipt number already exists. Please try again.');
        }
        throw error;
    }
});
// Generate receipt data
const generateReceiptData = (paymentId) => __awaiter(void 0, void 0, void 0, function* () {
    const payment = yield model_1.Payment.findById(paymentId)
        .populate('student')
        .populate({
        path: 'fees',
        select: 'feeType month amount discount waiver paidAmount dueAmount status',
    })
        .lean();
    if (!payment) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Payment not found');
    }
    const receiptData = {
        receiptNo: payment.receiptNo,
        paymentDate: payment.paymentDate,
        student: {
            name: payment.student.name,
            studentId: payment.student.studentId,
            className: payment.student.className || 'N/A',
        },
        fees: payment.fees.map((fee) => ({
            feeType: fee.feeType,
            month: fee.month,
            amount: fee.amount,
            discount: fee.discount || 0,
            waiver: fee.waiver || 0,
            netAmount: fee.amount - (fee.discount || 0) - (fee.waiver || 0),
            paidAmount: fee.paidAmount || 0,
            dueAmount: fee.dueAmount || 0,
            status: fee.status,
        })),
        payment: {
            totalAmount: payment.totalAmount,
            paymentMethod: payment.paymentMethod,
            transactionId: payment.transactionId,
            collectedBy: payment.collectedBy,
            note: payment.note,
        },
        summary: {
            totalFees: payment.fees.length,
            totalAmount: payment.fees.reduce((sum, fee) => sum + fee.amount, 0),
            totalAdjustments: payment.fees.reduce((sum, fee) => sum + (fee.discount || 0) + (fee.waiver || 0), 0),
            totalPaid: payment.totalAmount,
        },
    };
    return receiptData;
});
// Get student's receipts from Receipt model
const getStudentReceipts = (studentId) => __awaiter(void 0, void 0, void 0, function* () {
    const receipts = yield model_3.Receipt.find({ student: studentId })
        .sort({ paymentDate: -1 })
        .select('receiptNo totalAmount paymentMethod paymentDate collectedBy status')
        .lean();
    return receipts;
});
// Get receipt by receipt number
const getReceiptByNumber = (receiptNo) => __awaiter(void 0, void 0, void 0, function* () {
    const receipt = yield model_3.Receipt.findOne({ receiptNo })
        .populate('student', 'name studentId className')
        .lean();
    if (!receipt) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Receipt not found');
    }
    return receipt;
});
exports.paymentServices = {
    createBulkPayment,
    generateReceiptData,
    createPayment,
    getAllPayments,
    getSinglePayment: exports.getSinglePayment,
    updatePayment,
    deletePayment,
    getStudentReceipts,
    getReceiptByNumber,
};
