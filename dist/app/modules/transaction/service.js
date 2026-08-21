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
exports.transactionServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const model_1 = require("./model");
const createTransaction = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Transaction.create(payload);
    return result;
});
const getAllTransactions = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.default(model_1.Transaction.find(), query)
        .search(['name'])
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const data = yield queryBuilder.modelQuery;
    return { meta, data };
});
const getSingleTransaction = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Transaction.findById(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Transaction not found');
    }
    return result;
});
const updateTransaction = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Transaction.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update transaction');
    }
    return result;
});
const deleteTransaction = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.Transaction.findByIdAndDelete(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Transaction not found or already deleted');
    }
    return result;
});
exports.transactionServices = {
    createTransaction,
    getAllTransactions,
    getSingleTransaction,
    updateTransaction,
    deleteTransaction,
};
