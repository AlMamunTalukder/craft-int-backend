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
exports.expenseServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const ioredis_1 = __importDefault(require("ioredis"));
const expense_utils_1 = require("./expense.utils");
const expense_model_1 = require("./expense.model");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const redis = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
});
const createExpense = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const totalAmount = payload.expenseItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const expenseData = Object.assign(Object.assign({}, payload), { totalAmount });
    const result = yield expense_model_1.Expense.create(expenseData);
    yield (0, expense_utils_1.clearExpenseCache)();
    return result;
});
const getAllExpenses = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = `expenses:${JSON.stringify(query)}`;
    try {
        const cached = yield redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
    }
    catch (err) {
        console.error('Redis read error:', err);
    }
    const queryBuilder = new QueryBuilder_1.default(expense_model_1.Expense.find(), query)
        .search(['description', 'someOtherField'])
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const expenses = yield queryBuilder.modelQuery.populate('category');
    try {
        yield redis.setex(cacheKey, 300, JSON.stringify({ meta, expenses }));
    }
    catch (err) {
        console.error('Redis write error:', err);
    }
    return { meta, expenses };
});
const getSingleExpense = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = `expense:${id}`;
    try {
        const cached = yield redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
    }
    catch (err) {
        console.error('Redis read error:', err);
    }
    const expense = yield expense_model_1.Expense.findById(id).populate('category');
    yield (0, expense_utils_1.clearExpenseCache)();
    if (!expense) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Expense not found');
    }
    try {
        yield redis.setex(cacheKey, 300, JSON.stringify(expense));
    }
    catch (err) {
        console.error('Redis write error:', err);
    }
    return expense;
});
const updateExpense = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (payload.expenseItems && payload.expenseItems.length > 0) {
        payload.totalAmount = payload.expenseItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    }
    const expense = yield expense_model_1.Expense.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!expense) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update expense');
    }
    yield redis.del(`expense:${id}`);
    yield (0, expense_utils_1.clearExpenseCache)();
    return expense;
});
const deleteExpense = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const expense = yield expense_model_1.Expense.findByIdAndDelete(id);
    if (!expense) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Expense not found or already deleted');
    }
    yield redis.del(`expense:${id}`);
    yield (0, expense_utils_1.clearExpenseCache)();
    return expense;
});
const getExpenseTotalsByCategory = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield expense_model_1.Expense.aggregate([
        {
            $lookup: {
                from: "expensecategories",
                localField: "category",
                foreignField: "_id",
                as: "categoryInfo",
            },
        },
        {
            $unwind: {
                path: "$categoryInfo",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $group: {
                _id: "$categoryInfo.name",
                totalAmount: { $sum: "$totalAmount" },
                count: { $sum: 1 },
            },
        },
        {
            $project: {
                categoryName: "$_id",
                totalAmount: 1,
                count: 1,
                _id: 0,
            },
        },
    ]);
    return result;
});
exports.expenseServices = {
    createExpense,
    getAllExpenses,
    getSingleExpense,
    updateExpense,
    deleteExpense,
    getExpenseTotalsByCategory
};
