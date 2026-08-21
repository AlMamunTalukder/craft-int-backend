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
exports.feesControllers = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const catchAsync_1 = require("../../../utils/catchAsync");
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
const service_1 = require("./service");
const mongoose_1 = __importDefault(require("mongoose"));
const createMonthlyFees = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { studentId, enrollmentId, studentClass, yearlyFee, startYear } = req.body;
    const result = yield service_1.feesServices.generateMonthlyFees(studentId, enrollmentId, studentClass, yearlyFee, startYear);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Monthly fees created successfully',
        data: result,
    });
}));
const createBulkMonthlyFees = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { feeData } = req.body;
    const result = yield service_1.feesServices.generateBulkMonthlyFees(feeData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Bulk monthly fees created successfully',
        data: result,
    });
}));
const payFee = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { feeId, amountPaid, paymentMethod, transactionId, receiptNo } = req.body;
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const result = yield service_1.feesServices.payFee(feeId, amountPaid, paymentMethod, transactionId, receiptNo);
        yield session.commitTransaction();
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Fee payment processed successfully',
            data: result,
        });
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
}));
const payFeeWithAdvance = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { feeId, cashPaid, advanceUsed, paymentMethod, transactionId, receiptNo, } = req.body;
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const result = yield service_1.feesServices.payFeeWithAdvance(feeId, cashPaid, advanceUsed, paymentMethod, transactionId, receiptNo);
        yield session.commitTransaction();
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Fee payment with advance processed successfully',
            data: result,
        });
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
}));
const getStudentDueFees = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { studentId } = req.params;
    const { year } = req.query;
    const result = yield service_1.feesServices.getStudentDueFees(studentId, year ? parseInt(year) : undefined);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Student due fees retrieved successfully',
        data: result,
    });
}));
const getMonthlyFeeStatus = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { studentId, month, year } = req.params;
    const result = yield service_1.feesServices.getMonthlyFeeStatus(studentId, month, parseInt(year));
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Monthly fee status retrieved successfully',
        data: result,
    });
}));
const getAllFees = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.feesServices.getAllFees(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Fee records retrieved successfully',
        data: result,
    });
}));
const getSingleFee = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.feesServices.getSingleFee(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Fee record retrieved successfully',
        data: result,
    });
}));
const updateFee = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.feesServices.updateFee(req.params.id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Fee record updated successfully',
        data: result,
    });
}));
const deleteFee = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.feesServices.deleteFee(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Fee record deleted successfully',
        data: result,
    });
}));
const getAllDueFees = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { year, class: className, status } = req.query;
    let filterYear;
    if (year) {
        filterYear = parseInt(year);
        if (isNaN(filterYear)) {
            new Error('Invalid year');
        }
    }
    const result = yield service_1.feesServices.getAllDueFees({
        year: filterYear,
        class: className,
        status: status || 'unpaid',
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'All due fees retrieved successfully',
        data: result,
    });
}));
const createSingleFee = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const studentId = req.params.studentId || req.body.student;
    const payload = req.body;
    const result = yield service_1.feesServices.createSingleFee(studentId, payload);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Fee created successfully',
        data: result,
    });
}));
const getClassWiseFeeSummary = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { academicYear, class: className, month } = req.query;
    const result = yield service_1.feesServices.getClassWiseFeeSummary({
        academicYear: academicYear,
        class: className,
        month: month,
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Class-wise fee summary retrieved successfully',
        data: result,
    });
}));
exports.feesControllers = {
    createMonthlyFees,
    createBulkMonthlyFees,
    payFee,
    payFeeWithAdvance,
    getStudentDueFees,
    getMonthlyFeeStatus,
    getAllFees,
    getSingleFee,
    updateFee,
    deleteFee,
    getAllDueFees,
    createSingleFee,
    getClassWiseFeeSummary,
};
