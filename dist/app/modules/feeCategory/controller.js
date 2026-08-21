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
exports.feeCategoryControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const catchAsync_1 = require("../../../utils/catchAsync");
const service_1 = require("./service");
const AppError_1 = require("../../error/AppError");
const createFeeCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let result;
    if (Array.isArray(req.body)) {
        if (req.body.length === 0) {
            throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Please provide at least one fee category');
        }
        result = yield service_1.feeCategoryServices.createFeeCategory(req.body);
    }
    else {
        result = yield service_1.feeCategoryServices.createFeeCategory(req.body);
    }
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: Array.isArray(req.body)
            ? req.body.length > 1
                ? `${req.body.length} fee categories created successfully`
                : 'Fee category created successfully'
            : 'Fee category created successfully',
        data: result,
    });
}));
const getAllFeeCategories = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.feeCategoryServices.getAllFeeCategories(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Fee categories retrieved successfully',
        data: result,
    });
}));
const getSingleFeeCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.feeCategoryServices.getSingleFeeCategory(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Fee category retrieved successfully',
        data: result,
    });
}));
const updateFeeCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.feeCategoryServices.updateFeeCategory(req.params.id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Fee category updated successfully',
        data: result,
    });
}));
const deleteFeeCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.feeCategoryServices.deleteFeeCategory(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'Fee category deleted successfully',
        data: result,
    });
}));
exports.feeCategoryControllers = {
    createFeeCategory,
    getAllFeeCategories,
    getSingleFeeCategory,
    updateFeeCategory,
    deleteFeeCategory,
};
