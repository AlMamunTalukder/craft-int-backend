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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentServices = exports.getSingleStudent = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const student_model_1 = require("./student.model");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const student_constant_1 = require("./student.constant");
const student_utils_1 = require("./student.utils");
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("../user/user.model");
const class_model_1 = require("../class/class.model");
const createStudent = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, studentDepartment, email } = payload;
    // Validate required fields
    if (!name) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Student name is required');
    }
    if (!studentDepartment) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Student department is required');
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const studentId = yield (0, student_utils_1.generateStudentId)();
        // Check if the generated ID already exists
        const exists = yield student_model_1.Student.exists({ studentId });
        if (exists) {
            throw new AppError_1.AppError(http_status_1.default.CONFLICT, 'Generated Student ID already exists. Try again.');
        }
        // Handle sameAsPermanent logic for addresses
        if (payload.sameAsPermanent && payload.permanentAddress) {
            payload.presentAddress = Object.assign({}, payload.permanentAddress);
        }
        // Ensure arrays are properly formatted
        const processedPayload = Object.assign(Object.assign({}, payload), { studentId, className: Array.isArray(payload.className)
                ? payload.className
                : payload.className
                    ? [payload.className]
                    : [], section: Array.isArray(payload.section)
                ? payload.section
                : payload.section
                    ? [payload.section]
                    : [], activeSession: Array.isArray(payload.activeSession)
                ? payload.activeSession
                : payload.activeSession
                    ? [payload.activeSession]
                    : [] });
        const student = yield student_model_1.Student.create([processedPayload], {
            session,
        });
        const userPayload = {
            email: email ||
                `${studentId.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.com`,
            password: 'student123',
            name: name,
            role: 'student',
            studentId: studentId,
        };
        yield user_model_1.User.create([userPayload], { session });
        // Commit the transaction
        yield session.commitTransaction();
        // Populate the student document before returning
        const populatedStudent = yield student_model_1.Student.findById(student[0]._id)
            .populate('className')
            .populate('section')
            .populate('fees');
        return populatedStudent;
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
const getAllStudents = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const { className } = query, otherQuery = __rest(query, ["className"]);
    const processedQuery = Object.assign({}, otherQuery);
    // Handle className filter
    if (className) {
        const classValue = className;
        // Check if it's a valid ObjectId
        if (/^[0-9a-fA-F]{24}$/.test(classValue)) {
            // It's an ObjectId, keep it as is for QueryBuilder
            processedQuery.className = classValue;
        }
        else {
            // It's a class name string, we need to find the Class document first
            try {
                // Find the Class document by name
                const classDoc = yield class_model_1.Class.findOne({
                    className: { $regex: new RegExp(`^${classValue}$`, 'i') },
                });
                if (classDoc) {
                    // Use the ObjectId in the query
                    processedQuery.className = classDoc._id.toString();
                }
                else {
                    // If class not found, return empty results
                    return {
                        meta: {
                            page: Number(query.page) || 1,
                            limit: Number(query.limit) || 10000,
                            total: 0,
                            totalPage: 0,
                        },
                        data: [],
                    };
                }
            }
            catch (error) {
                console.error('Error finding class:', error);
                // Return empty results on error
                return {
                    meta: {
                        page: Number(query.page) || 1,
                        limit: Number(query.limit) || 10000,
                        total: 0,
                        totalPage: 0,
                    },
                    data: [],
                };
            }
        }
    }
    const studentQuery = new QueryBuilder_1.default(student_model_1.Student.find()
        .populate({
        path: 'fees',
        model: 'Fees',
    })
        .populate({
        path: 'className',
    })
        .populate({
        path: 'section',
    })
        .populate({
        path: 'payments',
        model: 'Payment',
    })
        .populate({
        path: 'mealAttendances',
        model: 'MealAttendance',
    }), processedQuery)
        .search(student_constant_1.studentSearchableFields)
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield studentQuery.countTotal();
    const data = yield studentQuery.modelQuery;
    return {
        meta,
        data,
    };
});
// export const getSingleStudent = async (id: string): Promise<any> => {
//   if (!mongoose.Types.ObjectId.isValid(id)) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'Invalid student ID');
//   }
//   const student = await Student.findById(id)
//     .populate({
//       path: 'fees',
//     })
//     .populate({
//       path: 'className',
//     })
//     .populate({
//       path: 'section',
//     })
//     .populate({
//       path: 'payments',
//       model: 'Payment',
//     })
//     .populate({
//       path: 'receipts',
//       model: 'Receipt',
//     })
//     .populate({
//       path: 'mealAttendances',
//       model: 'MealAttendance',
//       options: { sort: { date: -1 } }
//     });
//   if (!student) {
//     throw new AppError(httpStatus.NOT_FOUND, 'Student not found');
//   }
//   const mealAttendances = student.mealAttendances || [];
//   const totalMeals = mealAttendances.reduce((sum: number, att: any) => sum + (att.totalMeals || 0), 0);
//   const totalCost = mealAttendances.reduce((sum: number, att: any) => sum + (att.mealCost || 0), 0);
//   const totalBreakfast = mealAttendances.filter((att: any) => att.breakfast).length;
//   const totalLunch = mealAttendances.filter((att: any) => att.lunch).length;
//   const totalDinner = mealAttendances.filter((att: any) => att.dinner).length;
//   const totalPresentDays = mealAttendances.filter((att: any) => att.totalMeals > 0).length
//   const studentObject = student.toObject();
//   return {
//     ...studentObject,
//     mealStatistics: {
//       totalMeals,
//       totalCost,
//       totalBreakfast,
//       totalLunch,
//       totalDinner,
//       totalPresentDays,
//       totalAbsentDays: mealAttendances.length - totalPresentDays,
//       attendanceRate: mealAttendances.length > 0
//         ? ((totalPresentDays / mealAttendances.length) * 100).toFixed(2)
//         : '0',
//     },
//   };
// };
const getSingleStudent = (id) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Invalid student ID');
    }
    const student = yield student_model_1.Student.findById(id)
        .populate({
        path: 'fees',
    })
        .populate({
        path: 'className',
    })
        .populate({
        path: 'section',
    })
        .populate({
        path: 'payments',
        model: 'Payment',
    })
        .populate({
        path: 'receipts',
        model: 'Receipt',
    })
        .populate({
        path: 'mealAttendances',
        model: 'MealAttendance',
        options: { sort: { date: -1 } }
    })
        .populate({
        path: 'mealBalance',
        populate: {
            path: 'history.feeId',
            select: 'month amount status dueMealAmount futureMonthMealAmount advanceMealAmount mealCount',
        },
    });
    if (!student) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Student not found');
    }
    const mealAttendances = student.mealAttendances || [];
    const totalMeals = mealAttendances.reduce((sum, att) => sum + (att.totalMeals || 0), 0);
    const totalCost = mealAttendances.reduce((sum, att) => sum + (att.mealCost || 0), 0);
    const totalBreakfast = mealAttendances.filter((att) => att.breakfast).length;
    const totalLunch = mealAttendances.filter((att) => att.lunch).length;
    const totalDinner = mealAttendances.filter((att) => att.dinner).length;
    const totalPresentDays = mealAttendances.filter((att) => att.totalMeals > 0).length;
    const studentObject = student.toObject();
    // Latest month first in balance history
    if ((_a = studentObject.mealBalance) === null || _a === void 0 ? void 0 : _a.history) {
        studentObject.mealBalance.history = [...studentObject.mealBalance.history].reverse();
    }
    return Object.assign(Object.assign({}, studentObject), { mealStatistics: {
            totalMeals,
            totalCost,
            totalBreakfast,
            totalLunch,
            totalDinner,
            totalPresentDays,
            totalAbsentDays: mealAttendances.length - totalPresentDays,
            attendanceRate: mealAttendances.length > 0
                ? ((totalPresentDays / mealAttendances.length) * 100).toFixed(2)
                : '0',
        } });
});
exports.getSingleStudent = getSingleStudent;
const updateStudent = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Invalid student ID');
    }
    const existingStudent = yield student_model_1.Student.findById(id);
    if (!existingStudent) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Student not found');
    }
    if (payload.sameAsPermanent && payload.permanentAddress) {
        payload.presentAddress = Object.assign({}, payload.permanentAddress);
    }
    const processedPayload = Object.assign({}, payload);
    if (payload.className) {
        processedPayload.className = Array.isArray(payload.className)
            ? payload.className
            : [payload.className];
    }
    if (payload.section) {
        processedPayload.section = Array.isArray(payload.section)
            ? payload.section
            : [payload.section];
    }
    if (payload.activeSession) {
        processedPayload.activeSession = Array.isArray(payload.activeSession)
            ? payload.activeSession
            : [payload.activeSession];
    }
    const student = yield student_model_1.Student.findByIdAndUpdate(id, processedPayload, {
        new: true,
        runValidators: true,
    })
        .populate('className')
        .populate('section')
        .populate('fees');
    if (!student) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update student');
    }
    if (payload.email) {
        yield user_model_1.User.findOneAndUpdate({ studentId: student.studentId }, { email: payload.email }, { new: true, runValidators: true });
    }
    return student;
});
const deleteStudent = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Invalid student ID');
    }
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const student = yield student_model_1.Student.findById(id);
        if (!student) {
            throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Student not found');
        }
        const deletedStudent = yield student_model_1.Student.findByIdAndDelete(id, { session });
        yield user_model_1.User.findOneAndDelete({ studentId: student.studentId }, { session });
        yield session.commitTransaction();
        return deletedStudent;
    }
    catch (error) {
        yield session.abortTransaction();
        throw error;
    }
    finally {
        session.endSession();
    }
});
exports.studentServices = {
    createStudent,
    getAllStudents,
    getSingleStudent: exports.getSingleStudent,
    updateStudent,
    deleteStudent,
};
