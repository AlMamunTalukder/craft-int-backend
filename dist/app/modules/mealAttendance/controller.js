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
exports.mealAttendanceControllers = void 0;
// app/modules/mealAttendance/controller.ts
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const catchAsync_1 = require("../../../utils/catchAsync");
const service_1 = require("./service");
const bulkCreateAttendance = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.mealAttendanceServices.bulkCreateAttendance(req.body);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: 'Bulk meal attendance saved successfully', data: result });
}));
const getMonthlyAttendanceSheet = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { className, month, academicYear, personType } = req.query;
    if (!month || !academicYear) {
        return (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.BAD_REQUEST, success: false, message: 'month and academicYear are required', data: null });
    }
    const result = yield service_1.mealAttendanceServices.getMonthlyAttendanceSheet(personType || 'student', month, academicYear, className);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: 'Monthly attendance sheet retrieved successfully', data: result });
}));
const getMonthlySummary = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { className, month, academicYear, personType } = req.query;
    if (!month || !academicYear) {
        return (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.BAD_REQUEST, success: false, message: 'month and academicYear are required', data: null });
    }
    const result = yield service_1.mealAttendanceServices.getMonthlySummary(personType || 'student', month, academicYear, className);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: 'Monthly summary retrieved successfully', data: result });
}));
const getAllAttendanceRecords = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const personType = (req.query.personType || 'student');
    const className = req.query.className || '';
    const date = req.query.date || '';
    const month = req.query.month || '';
    const academicYear = req.query.academicYear || new Date().getFullYear().toString();
    const sortColumn = req.query.sortColumn || 'date';
    const sortDirection = (req.query.sortDirection || 'desc');
    const result = yield service_1.mealAttendanceServices.getAllAttendanceRecords(page, limit, search, personType, date, month, academicYear, sortColumn, sortDirection, className);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: 'Attendance records retrieved successfully', data: result });
}));
const getAttendanceById = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id)
        return (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.BAD_REQUEST, success: false, message: 'Attendance ID is required', data: null });
    const result = yield service_1.mealAttendanceServices.getAttendanceById(id);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: 'Attendance record retrieved successfully', data: result });
}));
const updateAttendance = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id)
        return (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.BAD_REQUEST, success: false, message: 'Attendance ID is required', data: null });
    const result = yield service_1.mealAttendanceServices.updateAttendance(id, req.body);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: 'Meal attendance updated successfully', data: result });
}));
const deleteAttendance = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.mealAttendanceServices.deleteAttendance(req.params.id);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: 'Meal attendance deleted successfully', data: result });
}));
const deleteMonthlyAttendance = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { className, month, academicYear, personType } = req.query;
    if (!month || !academicYear) {
        return (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.BAD_REQUEST, success: false, message: 'month and academicYear are required', data: null });
    }
    const result = yield service_1.mealAttendanceServices.deleteMonthlyAttendance(personType || 'student', month, academicYear, className);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: result.message, data: result });
}));
const getAttendanceByStudentAndMonth = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { studentId, month, academicYear } = req.params;
    if (!studentId || !month || !academicYear) {
        return (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.BAD_REQUEST, success: false, message: 'studentId, month and academicYear are required', data: null });
    }
    const result = yield service_1.mealAttendanceServices.getAttendanceByStudentAndMonth(studentId, month, academicYear);
    (0, sendResponse_1.default)(res, { statusCode: http_status_1.default.OK, success: true, message: 'Meal attendance retrieved successfully', data: result });
}));
const getCombinedMonthlySheet = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { month, academicYear, className } = req.query;
    const result = yield service_1.mealAttendanceServices.getCombinedMonthlySheet(month, academicYear, className);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Combined monthly meal attendance sheet (Student + Teacher + Staff) retrieved successfully',
        data: result,
    });
}));
exports.mealAttendanceControllers = {
    bulkCreateAttendance,
    getMonthlyAttendanceSheet,
    getMonthlySummary,
    getAllAttendanceRecords,
    getAttendanceById,
    updateAttendance,
    deleteAttendance,
    deleteMonthlyAttendance,
    getAttendanceByStudentAndMonth,
    getCombinedMonthlySheet
};
