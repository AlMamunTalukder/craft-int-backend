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
exports.subjectServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const AppError_1 = require("../../error/AppError");
const subject_assign_model_1 = require("./subject-assign.model");
const subject_assign_constant_1 = require("./subject-assign.constant");
const createSubject = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { subjectCode } = payload;
    if (!subjectCode) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Subject code is required');
    }
    const existingSubject = yield subject_assign_model_1.SubjectAssign.findOne({ subjectCode });
    if (existingSubject) {
        throw new AppError_1.AppError(http_status_1.default.CONFLICT, 'Subject already exists');
    }
    const result = yield subject_assign_model_1.SubjectAssign.create(payload);
    return result;
});
const getAllSubjects = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const subjectQuery = new QueryBuilder_1.default(subject_assign_model_1.SubjectAssign.find(), query)
        .search(subject_assign_constant_1.subjectSearchableFields)
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield subjectQuery.countTotal();
    const subjects = yield subjectQuery.modelQuery;
    return {
        meta,
        subjects,
    };
});
const getSingleSubject = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield subject_assign_model_1.SubjectAssign.findById(id).populate('classId').populate('teacherId');
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Subject not found');
    }
    return result;
});
const updateSubject = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield subject_assign_model_1.SubjectAssign.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update subject');
    }
    return result;
});
const deleteSubject = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield subject_assign_model_1.SubjectAssign.findByIdAndDelete(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Subject not found or already deleted');
    }
    return result;
});
exports.subjectServices = {
    createSubject,
    getAllSubjects,
    getSingleSubject,
    updateSubject,
    deleteSubject,
};
