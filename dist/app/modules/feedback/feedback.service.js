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
exports.feedbackServices = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const http_status_1 = __importDefault(require("http-status"));
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const AppError_1 = require("../../error/AppError");
const feedback_model_1 = require("./feedback.model");
const createFeedback = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!payload.type || !payload.title || !payload.description) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Type, Title, and Description are required');
    }
    const result = yield feedback_model_1.Feedback.create(payload);
    return result;
});
const getAllFeedbacks = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const feedbackQuery = new QueryBuilder_1.default(feedback_model_1.Feedback.find(), query)
        .search(['type', 'category', 'title', 'priority', 'department'])
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield feedbackQuery.countTotal();
    const feedbacks = yield feedbackQuery.modelQuery.exec();
    return {
        meta,
        feedbacks,
    };
});
const getSingleFeedback = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield feedback_model_1.Feedback.findById(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Feedback not found');
    }
    return result;
});
const updateFeedback = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield feedback_model_1.Feedback.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update feedback');
    }
    return result;
});
const deleteFeedback = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield feedback_model_1.Feedback.findByIdAndDelete(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Feedback not found or already deleted');
    }
    return result;
});
exports.feedbackServices = {
    createFeedback,
    getAllFeedbacks,
    getSingleFeedback,
    updateFeedback,
    deleteFeedback,
};
