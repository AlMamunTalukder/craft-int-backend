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
exports.homeTaskServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const hometask_model_1 = require("./hometask.model");
const createHomeTask = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (!payload.title || !payload.description) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Title and description are required');
    }
    const result = yield hometask_model_1.HomeTask.create(payload);
    return result;
});
const getAllHomeTasks = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield hometask_model_1.HomeTask.find();
    return result;
});
const getSingleHomeTask = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield hometask_model_1.HomeTask.findById(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Home task not found');
    }
    return result;
});
const updateHomeTask = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield hometask_model_1.HomeTask.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update home task');
    }
    return result;
});
const deleteHomeTask = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield hometask_model_1.HomeTask.findByIdAndDelete(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Home task not found or already deleted');
    }
    return result;
});
exports.homeTaskServices = {
    createHomeTask,
    getAllHomeTasks,
    getSingleHomeTask,
    updateHomeTask,
    deleteHomeTask,
};
