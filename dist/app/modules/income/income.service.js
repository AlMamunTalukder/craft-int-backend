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
exports.incomeServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const ioredis_1 = __importDefault(require("ioredis"));
const income_utils_1 = require("./income.utils");
const income_model_1 = require("./income.model");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const redis = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
});
const createIncome = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const totalAmount = payload.incomeItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const incomeData = Object.assign(Object.assign({}, payload), { totalAmount });
    const result = yield income_model_1.Income.create(incomeData);
    yield (0, income_utils_1.clearIncomeCache)();
    return result;
});
const getAllIncomes = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = `incomes:${JSON.stringify(query)}`;
    try {
        const cached = yield redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
    }
    catch (err) {
        console.error('Redis read error:', err);
    }
    const queryBuilder = new QueryBuilder_1.default(income_model_1.Income.find(), query)
        .search(['description', 'someOtherField'])
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const incomes = yield queryBuilder.modelQuery.populate('category');
    try {
        yield redis.setex(cacheKey, 300, JSON.stringify({ meta, incomes }));
    }
    catch (err) {
        console.error('Redis write error:', err);
    }
    return {
        meta,
        incomes,
    };
});
const getSingleIncome = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = `income:${id}`;
    try {
        const cached = yield redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
    }
    catch (err) {
        console.error('Redis read error:', err);
    }
    const income = yield income_model_1.Income.findById(id).populate('category');
    yield (0, income_utils_1.clearIncomeCache)();
    if (!income) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Income not found');
    }
    try {
        yield redis.setex(cacheKey, 300, JSON.stringify(income));
    }
    catch (err) {
        console.error('Redis write error:', err);
    }
    return income;
});
const updateIncome = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (payload.incomeItems && payload.incomeItems.length > 0) {
        payload.totalAmount = payload.incomeItems.reduce((sum, item) => sum + Number(item.amount || 0), 0);
    }
    const income = yield income_model_1.Income.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!income) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update income');
    }
    yield redis.del(`income:${id}`);
    yield (0, income_utils_1.clearIncomeCache)();
    return income;
});
const deleteIncome = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const income = yield income_model_1.Income.findByIdAndDelete(id);
    if (!income) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Income not found or already deleted');
    }
    yield redis.del(`income:${id}`);
    yield (0, income_utils_1.clearIncomeCache)();
    return income;
});
const getIncomeTotalsByCategory = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield income_model_1.Income.aggregate([
        {
            $lookup: {
                from: "incomecategories",
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
exports.incomeServices = {
    createIncome,
    getAllIncomes,
    getSingleIncome,
    updateIncome,
    deleteIncome,
    getIncomeTotalsByCategory,
};
