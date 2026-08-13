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
exports.receiptControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const catchAsync_1 = require("../../../utils/catchAsync");
const service_1 = require("./service");
const getCompleteReceipts = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { studentId } = req.params;
    const receipts = yield service_1.receiptServices.getCompleteReceipts(studentId);
    res.status(http_status_1.default.OK).json({
        success: true,
        message: 'সম্পূর্ণ রিসিট ডাটা সফলভাবে লোড হয়েছে',
        data: receipts,
    });
}));
const getStudentReceipts = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { studentId } = req.params;
    const receipts = yield service_1.receiptServices.getStudentReceipts(studentId);
    res.status(http_status_1.default.OK).json({
        success: true,
        message: 'রিসিটগুলি সফলভাবে লোড হয়েছে',
        data: receipts,
    });
}));
const getReceiptByNumber = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { receiptNo } = req.params;
    const receipt = yield service_1.receiptServices.getReceiptByNumber(receiptNo);
    res.status(http_status_1.default.OK).json({
        success: true,
        message: 'রিসিট সফলভাবে লোড হয়েছে',
        data: receipt,
    });
}));
const getReceiptForPrint = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { receiptNo } = req.params;
    const receipt = yield service_1.receiptServices.getReceiptForPrint(receiptNo);
    res.status(http_status_1.default.OK).json({
        success: true,
        message: 'প্রিন্টের জন্য রিসিট ডেটা প্রস্তুত',
        data: receipt,
    });
}));
const createManualReceipt = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const receiptData = req.body;
    const receipt = yield service_1.receiptServices.createManualReceipt(receiptData);
    res.status(http_status_1.default.CREATED).json({
        success: true,
        message: 'রিসিট সফলভাবে তৈরি হয়েছে',
        data: receipt,
    });
}));
exports.receiptControllers = {
    getStudentReceipts,
    getCompleteReceipts, // ← নতুন কন্ট্রোলার যোগ করুন
    getReceiptByNumber,
    getReceiptForPrint,
    createManualReceipt,
};
