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
exports.expenseCategoryServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const model_1 = require("./model");
const createExpenseCategory = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.ExpenseCategory.create(payload);
    return result;
});
const getAllExpenseCategorys = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.default(model_1.ExpenseCategory.find(), query)
        .search(['name'])
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const data = yield queryBuilder.modelQuery;
    return { meta, data };
});
const getSingleExpenseCategory = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.ExpenseCategory.findById(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'ExpenseCategory not found');
    }
    return result;
});
const updateExpenseCategory = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.ExpenseCategory.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update expenseCategory');
    }
    return result;
});
const deleteExpenseCategory = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.ExpenseCategory.findByIdAndDelete(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'ExpenseCategory not found or already deleted');
    }
    return result;
});
exports.expenseCategoryServices = {
    createExpenseCategory,
    getAllExpenseCategorys,
    getSingleExpenseCategory,
    updateExpenseCategory,
    deleteExpenseCategory,
};
