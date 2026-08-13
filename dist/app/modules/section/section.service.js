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
exports.sectionServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const section_constant_1 = require("./section.constant");
const section_model_1 = require("./section.model");
const createSection = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = payload;
    const existingSection = yield section_model_1.Section.findOne({ name });
    if (existingSection) {
        throw new AppError_1.AppError(http_status_1.default.CONFLICT, 'Section with this name already exists in this class');
    }
    const result = yield section_model_1.Section.create(payload);
    return result;
});
const getAllSections = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.default(section_model_1.Section.find(), query)
        .search(section_constant_1.sectionSearchableFields)
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const sections = yield queryBuilder.modelQuery;
    return {
        meta,
        sections,
    };
});
const getSingleSection = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield section_model_1.Section.findById(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Section not found');
    }
    return result;
});
const updateSection = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield section_model_1.Section.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update section');
    }
    return result;
});
const deleteSection = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield section_model_1.Section.findByIdAndDelete(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Section not found or already deleted');
    }
    return result;
});
exports.sectionServices = {
    createSection,
    getAllSections,
    getSingleSection,
    updateSection,
    deleteSection,
};
