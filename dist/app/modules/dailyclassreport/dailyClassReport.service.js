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
exports.dailyClassReportServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const dailyClassReport_model_1 = require("./dailyClassReport.model");
const dailyClassReport_constant_1 = require("./dailyClassReport.constant");
const createDailyClassReport = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield dailyClassReport_model_1.DailyClassReport.create(payload);
    return result;
});
const getAllDailyClassReports = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const reportQuery = new QueryBuilder_1.default(dailyClassReport_model_1.DailyClassReport.find(), query)
        .search(dailyClassReport_constant_1.dailyClassReportSearch)
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield reportQuery.countTotal();
    const reports = yield reportQuery.modelQuery;
    return {
        meta,
        reports,
    };
});
const getSingleDailyClassReport = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield dailyClassReport_model_1.DailyClassReport.findById(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Report not found');
    }
    return result;
});
const updateDailyClassReport = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield dailyClassReport_model_1.DailyClassReport.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update report');
    }
    return result;
});
const deleteDailyClassReport = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield dailyClassReport_model_1.DailyClassReport.findByIdAndDelete(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Report not found or already deleted');
    }
    return result;
});
exports.dailyClassReportServices = {
    createDailyClassReport,
    getAllDailyClassReports,
    getSingleDailyClassReport,
    updateDailyClassReport,
    deleteDailyClassReport,
};
