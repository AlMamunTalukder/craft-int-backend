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
exports.studentControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const student_service_1 = require("./student.service");
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const catchAsync_1 = require("../../../utils/catchAsync");
const student_model_1 = require("./student.model");
const AppError_1 = require("../../error/AppError");
const user_model_1 = require("../user/user.model");
const createStudent = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const student = yield student_service_1.studentServices.createStudent(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Student created successfully',
        data: student,
    });
}));
const getAllStudents = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield student_service_1.studentServices.getAllStudents(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Students retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
}));
const getStudentByUserId = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.params;
    const user = yield user_model_1.User.findOne({ userId: userId });
    if (!user) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'User not found');
    }
    const student = yield student_model_1.Student.findOne({
        user: user._id,
    })
        .populate('className')
        .populate('fees')
        .populate('payments')
        .populate('receipts');
    if (!student) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Student not found for this user');
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Student retrieved successfully',
        data: student,
    });
}));
const getSingleStudent = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const student = yield student_service_1.studentServices.getSingleStudent(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Student retrieved successfully',
        data: student,
    });
}));
const updateStudent = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const updatedStudent = yield student_service_1.studentServices.updateStudent(id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Student updated successfully',
        data: updatedStudent,
    });
}));
const deleteStudent = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const deletedStudent = yield student_service_1.studentServices.deleteStudent(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Student deleted successfully',
        data: deletedStudent,
    });
}));
exports.studentControllers = {
    createStudent,
    getAllStudents,
    getSingleStudent,
    updateStudent,
    deleteStudent,
    getStudentByUserId,
};
