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
exports.announcementServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const announcement_model_1 = require("./announcement.model");
const createAnnouncement = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield announcement_model_1.Announcement.create(payload);
    return result;
});
const getAllAnnouncements = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.default(announcement_model_1.Announcement.find(), query)
        .search(['name'])
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const announcements = yield queryBuilder.modelQuery;
    return {
        meta,
        announcements,
    };
});
const getSingleAnnouncement = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield announcement_model_1.Announcement.findById(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Announcement not found');
    }
    return result;
});
const updateAnnouncement = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield announcement_model_1.Announcement.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update announcement');
    }
    return result;
});
const deleteAnnouncement = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield announcement_model_1.Announcement.findByIdAndDelete(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Announcement not found or already deleted');
    }
    return result;
});
exports.announcementServices = {
    createAnnouncement,
    getAllAnnouncements,
    getSingleAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
};
