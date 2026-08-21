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
exports.sobokiDailyReportControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const catchAsync_1 = require("../../../utils/catchAsync");
const service_1 = require("./service");
const createSobokiDailyReport = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield service_1.sobokiDailyReportServices.createSobokiDailyReport(req.body, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Soboki Daily Report created successfully',
        data: result,
    });
}));
const getAllSobokiDailyReports = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.sobokiDailyReportServices.getAllSobokiDailyReports(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Soboki Daily Reports retrieved successfully',
        data: result,
    });
}));
const getSingleSobokiDailyReport = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.sobokiDailyReportServices.getSingleSobokiDailyReport(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Soboki Daily Report retrieved successfully',
        data: result,
    });
}));
const updateSobokiDailyReport = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const result = yield service_1.sobokiDailyReportServices.updateSobokiDailyReport(req.params.id, req.body, (_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Soboki Daily Report updated successfully',
        data: result,
    });
}));
const deleteSobokiDailyReport = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.sobokiDailyReportServices.deleteSobokiDailyReport(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Soboki Daily Report deleted successfully',
        data: result,
    });
}));
const getReportsByStudent = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.sobokiDailyReportServices.getReportsByStudent(req.params.studentName, req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Reports by student retrieved successfully',
        data: result,
    });
}));
exports.sobokiDailyReportControllers = {
    createSobokiDailyReport,
    getAllSobokiDailyReports,
    getSingleSobokiDailyReport,
    updateSobokiDailyReport,
    deleteSobokiDailyReport,
    getReportsByStudent,
};
