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
exports.admissionApplicationServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const model_1 = require("./model");
const utils_1 = require("./utils");
const createAdmissionApplication = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const applicationId = yield (0, utils_1.generateApplicationId)();
        const result = yield model_1.AdmissionApplication.create(Object.assign(Object.assign({}, payload), { applicationId }));
        return result;
    }
    catch (error) {
        console.error(' createAdmissionApplication error:', error);
        throw error;
    }
});
const getAllAdmissionApplications = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.default(model_1.AdmissionApplication.find(), query)
        .search(['name'])
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const data = yield queryBuilder.modelQuery;
    return { meta, data };
});
const getSingleAdmissionApplication = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.AdmissionApplication.findById(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'AdmissionApplication not found');
    }
    return result;
});
const updateAdmissionApplication = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.AdmissionApplication.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update AdmissionApplication');
    }
    return result;
});
const deleteAdmissionApplication = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield model_1.AdmissionApplication.findByIdAndDelete(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'AdmissionApplication not found');
    }
    return result;
});
exports.admissionApplicationServices = {
    createAdmissionApplication,
    getAllAdmissionApplications,
    getSingleAdmissionApplication,
    updateAdmissionApplication,
    deleteAdmissionApplication,
};
