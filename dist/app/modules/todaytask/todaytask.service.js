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
exports.todayTaskServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const mongoose_1 = __importDefault(require("mongoose"));
const AppError_1 = require("../../error/AppError");
const todaytask_model_1 = require("./todaytask.model");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const todaytask_constant_1 = require("./todaytask.constant");
const validateTodayTaskPayload = (payload) => {
    const { taskContent, dueDate } = payload;
    if (!taskContent || typeof taskContent !== 'string') {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Task content is required and must be a string');
    }
    if (!dueDate || isNaN(new Date(dueDate).getTime())) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Due date is required and must be a valid date');
    }
};
const createTodayTask = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    validateTodayTaskPayload(payload);
    const todayTaskData = {
        taskContent: payload.taskContent.trim(),
        dueDate: payload.dueDate,
    };
    const newTask = yield todaytask_model_1.TodayTask.create(todayTaskData);
    return newTask;
});
const getAllTodayTasks = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const todayTaskQuery = new QueryBuilder_1.default(todaytask_model_1.TodayTask.find(), query)
        .search(todaytask_constant_1.todayTaskSearchableFields)
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield todayTaskQuery.countTotal();
    const todayTasks = yield todayTaskQuery.modelQuery;
    return {
        meta,
        todayTasks,
    };
});
const getSingleTodayTask = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Invalid task ID');
    }
    const task = yield todaytask_model_1.TodayTask.findById(id);
    if (!task) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Today's task not found");
    }
    return task;
});
const updateTodayTask = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Invalid task ID');
    }
    const result = yield todaytask_model_1.TodayTask.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Failed to update today's task");
    }
    return result;
});
const deleteTodayTask = (id) => __awaiter(void 0, void 0, void 0, function* () {
    if (!mongoose_1.default.Types.ObjectId.isValid(id)) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Invalid task ID');
    }
    const result = yield todaytask_model_1.TodayTask.findByIdAndDelete(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, "Today's task not found or already deleted");
    }
    return result;
});
exports.todayTaskServices = {
    createTodayTask,
    getAllTodayTasks,
    getSingleTodayTask,
    updateTodayTask,
    deleteTodayTask,
};
