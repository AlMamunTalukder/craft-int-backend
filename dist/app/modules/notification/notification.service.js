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
exports.notificationServices = void 0;
const notification_model_1 = require("./notification.model");
const AppError_1 = require("../../error/AppError");
const http_status_1 = __importDefault(require("http-status"));
const createNotification = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield notification_model_1.Notification.create(payload);
    return result;
});
const getAllNotifications = () => __awaiter(void 0, void 0, void 0, function* () {
    return yield notification_model_1.Notification.find();
});
const getSingleNotification = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield notification_model_1.Notification.findById(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Notification not found');
    }
    return result;
});
const updateNotification = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield notification_model_1.Notification.findByIdAndUpdate(id, payload, { new: true });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update notification');
    }
    return result;
});
const deleteNotification = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield notification_model_1.Notification.findByIdAndDelete(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Notification not found or already deleted');
    }
    return result;
});
exports.notificationServices = {
    createNotification,
    getAllNotifications,
    getSingleNotification,
    updateNotification,
    deleteNotification,
};
