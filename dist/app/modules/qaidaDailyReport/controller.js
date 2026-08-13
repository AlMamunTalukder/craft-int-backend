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
exports.qaidaDailyReportControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const catchAsync_1 = require("../../../utils/catchAsync");
const service_1 = require("./service");
const validation_1 = require("./validation");
const validateRequest_1 = require("../../middlewares/validateRequest");
const createQaidaDailyReport = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.qaidaDailyReportServices.createQaidaDailyReport(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: "QaidaDailyReport created successfully",
        data: result,
    });
}));
const getAllQaidaDailyReports = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.qaidaDailyReportServices.getAllQaidaDailyReports(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "QaidaDailyReports retrieved successfully",
        data: result,
    });
}));
const getSingleQaidaDailyReport = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.qaidaDailyReportServices.getSingleQaidaDailyReport(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "QaidaDailyReport retrieved successfully",
        data: result,
    });
}));
const updateQaidaDailyReport = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.qaidaDailyReportServices.updateQaidaDailyReport(req.params.id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "QaidaDailyReport updated successfully",
        data: result,
    });
}));
const deleteQaidaDailyReport = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.qaidaDailyReportServices.deleteQaidaDailyReport(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: "QaidaDailyReport deleted successfully",
        data: result,
    });
}));
exports.qaidaDailyReportControllers = {
    createQaidaDailyReport: [
        (0, validateRequest_1.validateRequest)(validation_1.createQaidaDailyReportSchema),
        createQaidaDailyReport,
    ],
    getAllQaidaDailyReports,
    getSingleQaidaDailyReport,
    updateQaidaDailyReport: [
        (0, validateRequest_1.validateRequest)(validation_1.updateQaidaDailyReportSchema),
        updateQaidaDailyReport,
    ],
    deleteQaidaDailyReport,
};
