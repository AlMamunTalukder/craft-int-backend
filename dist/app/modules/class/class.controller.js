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
exports.classControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const class_service_1 = require("./class.service");
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const catchAsync_1 = require("../../../utils/catchAsync");
const createClass = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield class_service_1.classServices.createClass(req.body);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Class created successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
const getAllClasses = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const result = yield class_service_1.classServices.getAllClasses(req.query);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Classes retrieved successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
const getSingleClass = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield class_service_1.classServices.getSingleClass(id);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Class retrieved successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
const updateClass = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield class_service_1.classServices.updateClass(id, req.body);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Class updated successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
const deleteClass = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const result = yield class_service_1.classServices.deleteClass(id);
        (0, sendResponse_1.default)(res, {
            statusCode: http_status_1.default.OK,
            success: true,
            message: 'Class deleted successfully',
            data: result,
        });
    }
    catch (err) {
        next(err);
    }
}));
exports.classControllers = {
    createClass,
    getAllClasses,
    getSingleClass,
    updateClass,
    deleteClass,
};
