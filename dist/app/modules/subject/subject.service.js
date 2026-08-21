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
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const AppError_1 = require("../../error/AppError");
const subject_model_1 = require("./subject.model");
const subject_assign_constant_1 = require("../subject-assign/subject-assign.constant");
const createSubject = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, paper } = payload;
    if (!name || typeof name !== 'string') {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Subject name is required and must be a string');
    }
    const trimmedName = name.trim();
    // const existingSubjectByName = await Subject.findOne({ name: trimmedName });
    // if (existingSubjectByName) {
    //   throw new AppError(409, `Subject "${trimmedName}" already exists`);
    // }
    const subjectData = {
        name: trimmedName,
        paper: paper || '',
    };
    // Create and return new subject
    const newSubject = yield subject_model_1.Subject.create(subjectData);
    return newSubject;
});
const getAllSubjects = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const subjectQuery = new QueryBuilder_1.default(subject_model_1.Subject.find(), query)
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
    const result = yield subject_model_1.Subject.findById(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Subject not found');
    }
    return result;
});
const updateSubject = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(payload);
    const result = yield subject_model_1.Subject.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update subject');
    }
    return result;
});
const deleteSubject = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield subject_model_1.Subject.findByIdAndDelete(id);
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
