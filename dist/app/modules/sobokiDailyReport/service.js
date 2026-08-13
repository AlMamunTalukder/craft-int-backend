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
exports.sobokiDailyReportServices = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const model_1 = require("./model");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
// Calculate weekly summary from daily entries
const calculateWeeklySummary = (dailyEntries) => {
    let totalSobok = 0;
    let totalSatSobok = 0;
    let totalSabakAmukta = 0;
    let totalTilawat = 0;
    let totalRevision = 0;
    Object.values(dailyEntries).forEach((day) => {
        var _a, _b, _c;
        // Calculate Sobok total
        if ((_a = day.sobok) === null || _a === void 0 ? void 0 : _a.page) {
            totalSobok += parseInt(day.sobok.page) || 0;
        }
        // Calculate Sat Sobok total
        if ((_b = day.satSobok) === null || _b === void 0 ? void 0 : _b.amount) {
            totalSatSobok += parseInt(day.satSobok.amount) || 0;
        }
        // Calculate Sabak Amukta total
        if ((_c = day.sabakAmukta) === null || _c === void 0 ? void 0 : _c.page) {
            totalSabakAmukta += parseInt(day.sabakAmukta.page) || 0;
        }
        // Calculate Tilawat total
        if (day.tilawaAmount) {
            totalTilawat += parseInt(day.tilawaAmount) || 0;
        }
        // Calculate Revision total (only from Thursday)
        if (day.thursdayWeeklyRevision) {
            totalRevision += parseInt(day.thursdayWeeklyRevision) || 0;
        }
    });
    return {
        totalSobok,
        totalSatSobok,
        totalSabakAmukta,
        totalTilawat,
        totalRevision
    };
};
const createSobokiDailyReport = (payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const weeklySummary = calculateWeeklySummary(payload.dailyEntries);
    const reportData = Object.assign(Object.assign(Object.assign({}, payload), { weeklySummary }), (userId && { createdBy: userId }));
    const result = yield model_1.SobokiDailyReportModel.create(reportData);
    return result;
});
const getAllSobokiDailyReports = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const sobokiDailyReportQuery = new QueryBuilder_1.default(model_1.SobokiDailyReportModel.find(), query)
        .search(['teacherName', 'studentName', 'month'])
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield sobokiDailyReportQuery.countTotal();
    const data = yield sobokiDailyReportQuery.modelQuery;
    return { meta, data };
});
const getSingleSobokiDailyReport = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.SobokiDailyReportModel.findById(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Soboki Daily Report not found');
    }
    return result;
});
const updateSobokiDailyReport = (id, payload, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const existingReport = yield model_1.SobokiDailyReportModel.findById(id);
    if (!existingReport) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Soboki Daily Report not found');
    }
    let updateData = Object.assign({}, payload);
    if (payload.dailyEntries) {
        const weeklySummary = calculateWeeklySummary(payload.dailyEntries);
        updateData = Object.assign(Object.assign({}, updateData), { weeklySummary });
    }
    const result = yield model_1.SobokiDailyReportModel.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update Soboki Daily Report');
    }
    return result;
});
const deleteSobokiDailyReport = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.SobokiDailyReportModel.findByIdAndDelete(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Soboki Daily Report not found or already deleted');
    }
    return result;
});
const getReportsByStudent = (studentName, query) => __awaiter(void 0, void 0, void 0, function* () {
    const sobokiDailyReportQuery = new QueryBuilder_1.default(model_1.SobokiDailyReportModel.find({ studentName }).populate('createdBy', 'name email'), query)
        .filter()
        .sort()
        .paginate();
    const meta = yield sobokiDailyReportQuery.countTotal();
    const data = yield sobokiDailyReportQuery.modelQuery;
    return { meta, data };
});
exports.sobokiDailyReportServices = {
    createSobokiDailyReport,
    getAllSobokiDailyReports,
    getSingleSobokiDailyReport,
    updateSobokiDailyReport,
    deleteSobokiDailyReport,
    getReportsByStudent,
};
