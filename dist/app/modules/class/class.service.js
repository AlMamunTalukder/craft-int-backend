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
exports.classServices = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const http_status_1 = __importDefault(require("http-status"));
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const AppError_1 = require("../../error/AppError");
const class_model_1 = require("./class.model");
const class_constant_1 = require("./class.constant");
const createClass = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { className } = payload;
    const existingClass = yield class_model_1.Class.findOne({ className });
    if (existingClass) {
        throw new AppError_1.AppError(http_status_1.default.CONFLICT, 'Class already exists');
    }
    const result = yield class_model_1.Class.create(payload);
    return result;
});
const getAllClasses = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const classQuery = new QueryBuilder_1.default(class_model_1.Class.find().populate('sections'), query)
        .search(class_constant_1.classSearch)
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield classQuery.countTotal();
    const classes = yield classQuery.modelQuery;
    return {
        meta,
        classes,
    };
});
const getSingleClass = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield class_model_1.Class.findById(id).populate([{ path: 'sections' }]);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Class not found');
    }
    return result;
});
const updateClass = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield class_model_1.Class.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update class');
    }
    return result;
});
const deleteClass = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield class_model_1.Class.findByIdAndDelete(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Class not found or already deleted');
    }
    return result;
});
exports.classServices = {
    createClass,
    getAllClasses,
    getSingleClass,
    updateClass,
    deleteClass,
};
