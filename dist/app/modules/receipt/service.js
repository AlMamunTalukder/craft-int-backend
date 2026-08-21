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
exports.receiptServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const model_1 = require("./model");
const numberToWords_1 = require("../../../utils/numberToWords");
const createReceipt = (paymentData, studentData, feeDetails) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const receiptNo = `RCP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        // Calculate summary values
        const subtotal = feeDetails.reduce((sum, fee) => sum + fee.originalAmount, 0);
        const totalDiscount = feeDetails.reduce((sum, fee) => sum + (fee.discount || 0), 0);
        const totalWaiver = feeDetails.reduce((sum, fee) => sum + (fee.waiver || 0), 0);
        const totalNetAmount = feeDetails.reduce((sum, fee) => sum + fee.netAmount, 0);
        const amountPaid = paymentData.totalAmount;
        const receiptData = {
            receiptNo,
            student: paymentData.studentId,
            studentName: studentData.name,
            studentId: studentData.studentId,
            className: studentData.className || 'N/A',
            paymentId: paymentData._id,
            totalAmount: paymentData.totalAmount,
            paymentMethod: paymentData.paymentMethod,
            paymentDate: paymentData.paymentDate || new Date(),
            collectedBy: paymentData.collectedBy,
            transactionId: paymentData.transactionId,
            note: paymentData.note,
            fees: feeDetails.map((fee) => ({
                feeType: fee.feeType,
                month: fee.month,
                originalAmount: fee.originalAmount,
                discount: fee.discount || 0,
                waiver: fee.waiver || 0,
                netAmount: fee.netAmount,
                paidAmount: fee.paidAmount,
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
        };
        const receipt = yield model_1.Receipt.create(receiptData);
        return receipt;
    }
    catch (error) {
        throw new AppError_1.AppError(http_status_1.default.INTERNAL_SERVER_ERROR, 'Failed to make receipt');
    }
});
const getStudentReceipts = (studentId) => __awaiter(void 0, void 0, void 0, function* () {
    const receipts = yield model_1.Receipt.find({ student: studentId })
        .sort({ paymentDate: -1 })
        .populate('student', 'name studentId className')
        .lean();
    return receipts;
});
const getCompleteReceipts = (studentId) => __awaiter(void 0, void 0, void 0, function* () {
    const receipts = yield model_1.Receipt.find({ student: studentId })
        .sort({ paymentDate: -1 })
        .populate('student', 'name studentId className email phone')
        .populate('generatedBy', 'name email')
        .lean();
    return receipts;
});
const getReceiptByNumber = (receiptNo) => __awaiter(void 0, void 0, void 0, function* () {
    const receipt = yield model_1.Receipt.findOne({ receiptNo })
        .populate('student', 'name studentId className email phone')
        .populate('generatedBy', 'name email')
        .lean();
    if (!receipt) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Do not found money receipt!');
    }
    return receipt;
});
const getReceiptForPrint = (receiptNo) => __awaiter(void 0, void 0, void 0, function* () {
    const receipt = yield model_1.Receipt.findOne({ receiptNo }).lean();
    if (!receipt) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Do not found money receipt!');
    }
    const formattedReceipt = Object.assign(Object.assign({}, receipt), { formattedDate: new Date(receipt.paymentDate).toLocaleDateString('bn-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }), formattedTime: new Date(receipt.paymentDate).toLocaleTimeString('bn-BD', {
            hour: '2-digit',
            minute: '2-digit',
        }) });
    return formattedReceipt;
});
const createManualReceipt = (receiptData) => __awaiter(void 0, void 0, void 0, function* () {
    const receipt = yield model_1.Receipt.create(receiptData);
    return receipt;
});
exports.receiptServices = {
    createReceipt,
    getStudentReceipts,
    getCompleteReceipts,
    getReceiptByNumber,
    getReceiptForPrint,
    createManualReceipt,
};
