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
exports.feeCategoryServices = void 0;
/* eslint-disable @typescript-eslint/no-explicit-any */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const model_1 = require("./model");
const createFeeCategory = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (Array.isArray(payload)) {
        //  Check for duplicates within the incoming array itself
        const seen = new Set();
        for (const item of payload) {
            const key = `${item.className}-${item.categoryName || ''}`;
            if (seen.has(key)) {
                throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, `Duplicate entry in request: className "${item.className}" with category "${item.categoryName}" appears more than once`);
            }
            seen.add(key);
        }
        // ✅ Check against existing DB records
        const existingDocs = yield model_1.FeeCategory.find({
            $or: payload.map((item) => ({
                className: item.className,
                categoryName: item.categoryName || '',
            })),
        });
        if (existingDocs.length > 0) {
            const conflictList = existingDocs
                .map((doc) => `"${doc.className} - ${doc.categoryName}"`)
                .join(', ');
            throw new AppError_1.AppError(http_status_1.default.CONFLICT, `Fee category already exists for: ${conflictList}`);
        }
        const result = yield model_1.FeeCategory.insertMany(payload);
        return result;
    }
    else {
        // ✅ Check single entry against DB
        const existing = yield model_1.FeeCategory.findOne({
            className: payload.className,
            categoryName: payload.categoryName || '',
        });
        if (existing) {
            throw new AppError_1.AppError(http_status_1.default.CONFLICT, `Fee category already exists for class "${payload.className}" with category "${payload.categoryName}"`);
        }
        const result = yield model_1.FeeCategory.create(payload);
        return result;
    }
});
const getAllFeeCategories = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.default(model_1.FeeCategory.find(), query)
        .search(['name'])
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const data = yield queryBuilder.modelQuery;
    return { meta, data };
});
const getSingleFeeCategory = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.FeeCategory.findById(id);
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Fee category not found');
    return result;
});
const updateFeeCategory = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.FeeCategory.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update fee category');
    return result;
});
const deleteFeeCategory = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.FeeCategory.findByIdAndDelete(id);
    if (!result)
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Fee category not found or already deleted');
    return result;
});
exports.feeCategoryServices = {
    createFeeCategory,
    getAllFeeCategories,
    getSingleFeeCategory,
    updateFeeCategory,
    deleteFeeCategory,
};
