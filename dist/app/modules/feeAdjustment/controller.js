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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.feeAdjustmentControllers = void 0;
// feeAdjustment/controller.ts
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const catchAsync_1 = require("../../../utils/catchAsync");
const service_1 = require("./service");
const createFeeAdjustment = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.feeAdjustmentServices.createFeeAdjustment(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Fee Adjustment created and applied successfully',
        data: result,
    });
}));
const applyBulkAdjustments = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const _a = req.body, { studentId } = _a, adjustmentData = __rest(_a, ["studentId"]);
    const result = yield service_1.feeAdjustmentServices.applyAdjustmentToStudentFees(studentId, adjustmentData);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Fee Adjustments applied to all student fees successfully',
        data: result,
    });
}));
const getStudentAdjustments = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { studentId } = req.params;
    const { academicYear } = req.query;
    const result = yield service_1.feeAdjustmentServices.getStudentActiveAdjustments(studentId, academicYear);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Student fee adjustments retrieved successfully',
        data: result,
    });
}));
const getFeeReport = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { studentId, academicYear } = req.params;
    const result = yield service_1.feeAdjustmentServices.getFeeReportWithAdjustments(studentId, academicYear);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Fee report with adjustments retrieved successfully',
        data: result,
    });
}));
// আগের controller functions গুলো একই থাকবে
const getAllFeeAdjustments = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.feeAdjustmentServices.getAllFeeAdjustments(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'FeeAdjustments retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
}));
const getSingleFeeAdjustment = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.feeAdjustmentServices.getSingleFeeAdjustment(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'FeeAdjustment retrieved successfully',
        data: result,
    });
}));
const updateFeeAdjustment = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.feeAdjustmentServices.updateFeeAdjustment(req.params.id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'FeeAdjustment updated successfully',
        data: result,
    });
}));
const deleteFeeAdjustment = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.feeAdjustmentServices.deleteFeeAdjustment(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'FeeAdjustment deleted successfully',
        data: result,
    });
}));
exports.feeAdjustmentControllers = {
    createFeeAdjustment,
    getAllFeeAdjustments,
    getSingleFeeAdjustment,
    updateFeeAdjustment,
    deleteFeeAdjustment,
    applyBulkAdjustments,
    getStudentAdjustments,
    getFeeReport,
};
