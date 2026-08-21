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
exports.expenseCategoryControllers = void 0;
const http_status_1 = __importDefault(require("http-status"));
const sendResponse_1 = __importDefault(require("../../../utils/sendResponse"));
const catchAsync_1 = require("../../../utils/catchAsync");
const service_1 = require("./service");
const createExpenseCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.expenseCategoryServices.createExpenseCategory(req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.CREATED,
        success: true,
        message: 'ExpenseCategory created successfully',
        data: result,
    });
}));
const getAllExpenseCategorys = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.expenseCategoryServices.getAllExpenseCategorys(req.query);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'ExpenseCategorys retrieved successfully',
        data: result,
    });
}));
const getSingleExpenseCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.expenseCategoryServices.getSingleExpenseCategory(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'ExpenseCategory retrieved successfully',
        data: result,
    });
}));
const updateExpenseCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.expenseCategoryServices.updateExpenseCategory(req.params.id, req.body);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'ExpenseCategory updated successfully',
        data: result,
    });
}));
const deleteExpenseCategory = (0, catchAsync_1.catchAsync)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield service_1.expenseCategoryServices.deleteExpenseCategory(req.params.id);
    (0, sendResponse_1.default)(res, {
        statusCode: http_status_1.default.OK,
        success: true,
        message: 'ExpenseCategory deleted successfully',
        data: result,
    });
}));
exports.expenseCategoryControllers = {
    createExpenseCategory,
    getAllExpenseCategorys,
    getSingleExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
};
