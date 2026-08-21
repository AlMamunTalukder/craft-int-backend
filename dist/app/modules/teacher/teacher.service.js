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
exports.teacherServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const teacher_model_1 = require("./teacher.model");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const teacher_utils_1 = require("./teacher.utils");
const teacher_constant_1 = require("./teacher.constant");
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("../user/user.model");
const teacher_population_1 = require("../../../utils/teacher.population");
const createTeacher = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, name } = payload;
    if (!email || !name) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Required fields are missing');
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const teacherId = yield (0, teacher_utils_1.generateTeacherId)();
        const existingTeacher = yield teacher_model_1.Teacher.findOne({ teacherId });
        if (existingTeacher) {
            throw new AppError_1.AppError(http_status_1.default.CONFLICT, 'Generated Teacher ID already exists. Try again.');
        }
        const teacher = yield teacher_model_1.Teacher.create([Object.assign(Object.assign({}, payload), { teacherId })], {
            session,
        });
        yield user_model_1.User.create([
            {
                email,
                password: 'teacher123',
                name,
                role: 'teacher',
            },
        ], { session });
        yield session.commitTransaction();
        return teacher[0];
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
const getAllTeachers = (query) => __awaiter(void 0, void 0, void 0, function* () {
    // Get population configurations based on query parameters
    const populations = (0, teacher_population_1.getTeacherPopulations)({
        withSchedule: query.withSchedule === 'true',
        withAssignments: query.withAssignments === 'true',
        withAttendance: query.withAttendance === 'true',
        withMeals: query.withMeals === 'true',
        limit: query.populateLimit ? Number(query.populateLimit) : 10
    });
    const teacherQuery = new QueryBuilder_1.default(teacher_model_1.Teacher.find(), query)
        .search(teacher_constant_1.teacherSearchableFields)
        .filter()
        .sort()
        .paginate()
        .fields();
    // Apply collation for teacherSerial numeric sorting
    if (typeof query.sort === "string" &&
        (query.sort === "teacherSerial" || query.sort === "-teacherSerial")) {
        teacherQuery.modelQuery.collation({
            locale: "en",
            numericOrdering: true,
        });
    }
    // Apply all populations
    populations.forEach(populateConfig => {
        if (populateConfig.populate) {
            // Handle nested population
            teacherQuery.modelQuery = teacherQuery.modelQuery.populate(populateConfig);
        }
        else {
            // Handle simple population
            teacherQuery.modelQuery = teacherQuery.modelQuery.populate(populateConfig.path, populateConfig.select);
        }
    });
    const meta = yield teacherQuery.countTotal();
    const data = yield teacherQuery.modelQuery;
    return {
        meta,
        data,
    };
});
// Usage in getSingleTeacher
const getSingleTeacher = (id) => __awaiter(void 0, void 0, void 0, function* () {
    let query = teacher_model_1.Teacher.findById(id);
    const populations = (0, teacher_population_1.getTeacherPopulations)({
        withSchedule: true,
        withAssignments: true,
        withAttendance: true,
        withMeals: true,
        limit: 15
    });
    populations.forEach(populateConfig => {
        query = query.populate(populateConfig);
    });
    const teacher = yield query;
    if (!teacher) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Teacher not found');
    }
    return teacher;
});
const updateTeacher = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const updatedTeacher = yield teacher_model_1.Teacher.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!updatedTeacher) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update teacher');
    }
    return updatedTeacher;
});
const deleteTeacher = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const teacher = yield teacher_model_1.Teacher.findByIdAndDelete(id);
    if (!teacher) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Teacher not found or already deleted');
    }
    return teacher;
});
exports.teacherServices = {
    createTeacher,
    getAllTeachers,
    getSingleTeacher,
    updateTeacher,
    deleteTeacher,
};
