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
exports.teacherControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const teacher_service_1 = require("./teacher.service");
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const catchAsync_1 = require("../../../utils/catchAsync");
const syncTeachersWithUsers_1 = require("../../../scripts/syncTeachersWithUsers");
// Create new teacher
const createTeacher = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const teacher = yield teacher_service_1.teacherServices.createTeacher(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'Teacher created successfully',
        data: teacher,
    });
}));
// Get all teachers
const getAllTeachers = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield teacher_service_1.teacherServices.getAllTeachers(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Teachers retrieved successfully',
        meta: result.meta,
        data: result.data,
    });
}));
// Get single teacher
const getSingleTeacher = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const teacher = yield teacher_service_1.teacherServices.getSingleTeacher(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Teacher retrieved successfully',
        data: teacher,
    });
}));
// Update teacher
const updateTeacher = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const updatedTeacher = yield teacher_service_1.teacherServices.updateTeacher(id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Teacher updated successfully',
        data: updatedTeacher,
    });
}));
// Delete teacher
const deleteTeacher = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const deletedTeacher = yield teacher_service_1.teacherServices.deleteTeacher(id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Teacher deleted successfully',
        data: deletedTeacher,
    });
}));
const syncTeacherUsers = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    (0, syncTeachersWithUsers_1.syncTeachersWithUsers)()
        .then(() => {
        console.log('Teacher sync completed');
    })
        .catch((error) => {
        console.error('Teacher sync failed:', error);
    });
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Teacher sync started in background. Check console for details.',
        data: null,
    });
}));
exports.teacherControllers = {
    createTeacher,
    getAllTeachers,
    getSingleTeacher,
    updateTeacher,
    deleteTeacher,
    syncTeacherUsers,
};
