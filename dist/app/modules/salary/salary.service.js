"use strict";
// src/modules/salary/salary.service.ts
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
exports.salaryServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const ioredis_1 = __importDefault(require("ioredis"));
const salary_model_1 = require("./salary.model");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const salary_utils_1 = require("./salary.utils");
const redis = new ioredis_1.default({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: 3,
});
const createSalary = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Calculate allowances total
    const allowances = (payload.houseRent || 0) +
        (payload.medicalAllowance || 0) +
        (payload.transportAllowance || 0) +
        (payload.foodAllowance || 0) +
        (payload.otherAllowances || 0);
    // Calculate deductions total
    const deductions = (payload.incomeTax || 0) +
        (payload.providentFund || 0) +
        (payload.otherDeductions || 0);
    // Calculate gross and net salary
    payload.grossSalary = (payload.basicSalary || 0) + allowances;
    payload.netSalary = payload.grossSalary - deductions;
    // Optional: prevent negative net salary here
    if (payload.netSalary < 0) {
        throw new Error("Net salary cannot be negative");
    }
    // Save to DB
    const result = yield salary_model_1.Salary.create(payload);
    yield (0, salary_utils_1.clearSalaryCache)();
    return result;
});
const getAllSalaries = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = `salaries:${JSON.stringify(query)}`;
    try {
        const cached = yield redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
    }
    catch (err) {
        console.error('Redis read error:', err);
    }
    const queryBuilder = new QueryBuilder_1.default(salary_model_1.Salary.find(), query)
        .search(['notes'])
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const salaries = yield queryBuilder.modelQuery;
    // const salaries = await queryBuilder.modelQuery.populate("employeeId");
    try {
        yield redis.setex(cacheKey, 300, JSON.stringify({ meta, salaries }));
    }
    catch (err) {
        console.error('Redis write error:', err);
    }
    return {
        meta,
        salaries,
    };
});
const getSingleSalary = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = `salary:${id}`;
    try {
        const cached = yield redis.get(cacheKey);
        if (cached) {
            return JSON.parse(cached);
        }
    }
    catch (err) {
        console.error('Redis read error:', err);
    }
    const salary = yield salary_model_1.Salary.findById(id);
    if (!salary) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Salary record not found');
    }
    try {
        yield redis.setex(cacheKey, 300, JSON.stringify(salary));
    }
    catch (err) {
        console.error('Redis write error:', err);
    }
    return salary;
});
const updateSalary = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (payload.basicSalary !== undefined ||
        payload.houseRent !== undefined ||
        payload.medicalAllowance !== undefined ||
        payload.transportAllowance !== undefined ||
        payload.foodAllowance !== undefined ||
        payload.otherAllowances !== undefined ||
        payload.incomeTax !== undefined ||
        payload.providentFund !== undefined ||
        payload.otherDeductions !== undefined) {
        const allowances = (payload.houseRent || 0) +
            (payload.medicalAllowance || 0) +
            (payload.transportAllowance || 0) +
            (payload.foodAllowance || 0) +
            (payload.otherAllowances || 0);
        const deductions = (payload.incomeTax || 0) +
            (payload.providentFund || 0) +
            (payload.otherDeductions || 0);
        payload.grossSalary = (payload.basicSalary || 0) + allowances;
        payload.netSalary = payload.grossSalary - deductions;
    }
    const salary = yield salary_model_1.Salary.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!salary) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update salary record');
    }
    yield redis.del(`salary:${id}`);
    yield (0, salary_utils_1.clearSalaryCache)();
    return salary;
});
const deleteSalary = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const salary = yield salary_model_1.Salary.findByIdAndDelete(id);
    if (!salary) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Salary record not found or already deleted');
    }
    yield redis.del(`salary:${id}`);
    yield (0, salary_utils_1.clearSalaryCache)();
    return salary;
});
exports.salaryServices = {
    createSalary,
    getAllSalaries,
    getSingleSalary,
    updateSalary,
    deleteSalary,
};
