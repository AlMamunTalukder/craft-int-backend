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
exports.feedbackControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const catchAsync_1 = require("../../../utils/catchAsync");
const feedback_service_1 = require("./feedback.service");
const createFeedback = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield feedback_service_1.feedbackServices.createFeedback(req.body);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Feedback submitted successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
const getAllFeedbacks = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield feedback_service_1.feedbackServices.getAllFeedbacks(req.query);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Feedbacks retrieved successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
const getSingleFeedback = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield feedback_service_1.feedbackServices.getSingleFeedback(id);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Feedback retrieved successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
const updateFeedback = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield feedback_service_1.feedbackServices.updateFeedback(id, req.body);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Feedback updated successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
const deleteFeedback = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield feedback_service_1.feedbackServices.deleteFeedback(id);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Feedback deleted successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
exports.feedbackControllers = {
    createFeedback,
    getAllFeedbacks,
    getSingleFeedback,
    updateFeedback,
    deleteFeedback,
};
