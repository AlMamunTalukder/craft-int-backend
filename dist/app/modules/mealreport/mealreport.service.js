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
exports.mealReportServices = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const http_status_1 = __importDefault(require("http-status"));
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const AppError_1 = require("../../error/AppError");
const mealreport_model_1 = __importDefault(require("./mealreport.model"));
const mealreport_constant_1 = require("./mealreport.constant");
const createMealReport = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { date } = payload;
    if (!date) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Date and meal type are required');
    }
    const existingReport = yield mealreport_model_1.default.findOne({
        date,
    });
    if (existingReport) {
        throw new AppError_1.AppError(http_status_1.default.CONFLICT, 'Meal report already exists for this date and type');
    }
    const result = yield mealreport_model_1.default.create(payload);
    return result;
});
const getAllMealReports = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const reportQuery = new QueryBuilder_1.default(mealreport_model_1.default.find(), query)
        .search(mealreport_constant_1.mealReportSearchableFields)
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield reportQuery.countTotal();
    const mealReports = yield reportQuery.modelQuery
        .populate({
        path: 'students.personId',
        model: 'Student',
    })
        .populate({
        path: 'teachers.personId',
        model: 'Teacher',
    })
        .exec();
    return {
        meta,
        mealReports,
    };
});
const getSingleMealReport = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield mealreport_model_1.default.findById(id).populate('students');
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Meal report not found');
    }
    return result;
});
const updateMealReport = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield mealreport_model_1.default.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    }).populate('students');
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update meal report');
    }
    return result;
});
const deleteMealReport = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield mealreport_model_1.default.findByIdAndDelete(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Meal report not found or already deleted');
    }
    return result;
});
exports.mealReportServices = {
    createMealReport,
    getAllMealReports,
    getSingleMealReport,
    updateMealReport,
    deleteMealReport,
};
