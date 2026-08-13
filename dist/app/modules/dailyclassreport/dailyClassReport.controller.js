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
exports.dailyClassReportControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const dailyClassReport_service_1 = require("./dailyClassReport.service");
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const catchAsync_1 = require("../../../utils/catchAsync");
const createDailyClassReport = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield dailyClassReport_service_1.dailyClassReportServices.createDailyClassReport(req.body);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Daily class report created successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
const getAllDailyClassReports = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield dailyClassReport_service_1.dailyClassReportServices.getAllDailyClassReports(req.query);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Daily class reports retrieved successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
const getSingleDailyClassReport = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield dailyClassReport_service_1.dailyClassReportServices.getSingleDailyClassReport(id);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Daily class report retrieved successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
const updateDailyClassReport = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield dailyClassReport_service_1.dailyClassReportServices.updateDailyClassReport(id, req.body);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Daily class report updated successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
const deleteDailyClassReport = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield dailyClassReport_service_1.dailyClassReportServices.deleteDailyClassReport(id);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Daily class report deleted successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
exports.dailyClassReportControllers = {
    createDailyClassReport,
    getAllDailyClassReports,
    getSingleDailyClassReport,
    updateDailyClassReport,
    deleteDailyClassReport,
};
