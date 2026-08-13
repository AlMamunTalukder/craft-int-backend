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
exports.todayLessonServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const todaylesson_model_1 = require("./todaylesson.model");
const mongoose_1 = __importDefault(require("mongoose"));
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const todaylesson_constant_1 = require("./todaylesson.constant");
const validateTodayLessonPayload = (payload) => {
    const { lessonContent } = payload;
    if (!lessonContent || typeof lessonContent !== 'string') {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Lesson content is required and must be a string');
    }
};
const createTodayLesson = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    validateTodayLessonPayload(payload);
    const trimmedLessonContent = payload.lessonContent.trim();
    const todayLessonData = {
        lessonContent: trimmedLessonContent,
    };
    const newLesson = yield todaylesson_model_1.TodayLesson.create(todayLessonData);
    return newLesson;
});
const getAllTodayLessons = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const todayLessonQuery = new QueryBuilder_1.default(todaylesson_model_1.TodayLesson.find(), query)
        .search(todaylesson_constant_1.todayLessonSearchableFields)
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield todayLessonQuery.countTotal();
    const todayLessons = yield todayLessonQuery.modelQuery;
    return {
        meta,
        todayLessons,
    };
});
const getSingleTodayLesson = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Invalid lesson ID');
    }
    const lesson = yield todaylesson_model_1.TodayLesson.findById(id);
    if (!lesson) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Today's lesson not found");
    }
    return lesson;
});
const updateTodayLesson = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Invalid lesson ID');
    }
    const result = yield todaylesson_model_1.TodayLesson.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Failed to update today's lesson");
    }
    return result;
});
const deleteTodayLesson = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Invalid lesson ID');
    }
    const result = yield todaylesson_model_1.TodayLesson.findByIdAndDelete(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Today's lesson not found or already deleted");
    }
    return result;
});
exports.todayLessonServices = {
    createTodayLesson,
    getAllTodayLessons,
    getSingleTodayLesson,
    updateTodayLesson,
    deleteTodayLesson,
};
