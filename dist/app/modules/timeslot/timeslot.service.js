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
exports.timeSlotServices = exports.createTimeSlot = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const timeslot_model_1 = require("./timeslot.model");
const timeslot_constant_1 = require("./timeslot.constant");
const date_fns_1 = require("date-fns");
const createTimeSlot = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { startTime, endTime, day, title } = payload;
    if (!startTime || !endTime || !day) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, "Missing required fields");
    }
    const formattedStart = (0, date_fns_1.format)(new Date(startTime), "hh:mm a");
    const formattedEnd = (0, date_fns_1.format)(new Date(endTime), "hh:mm a");
    const result = yield timeslot_model_1.TimeSlot.create({
        title,
        day,
        startTime: formattedStart,
        endTime: formattedEnd,
        isActive: (_a = payload.isActive) !== null && _a !== void 0 ? _a : true,
    });
    return result;
});
exports.createTimeSlot = createTimeSlot;
const getAllTimeSlots = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.default(timeslot_model_1.TimeSlot.find(), query)
        .search(timeslot_constant_1.timeSlotSearchableFields)
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const timeSlots = yield queryBuilder.modelQuery;
    return {
        meta,
        timeSlots,
    };
});
const getSingleTimeSlot = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield timeslot_model_1.TimeSlot.findById(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Time slot not found');
    }
    return result;
});
const updateTimeSlot = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield timeslot_model_1.TimeSlot.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update time slot');
    }
    return result;
});
const deleteTimeSlot = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield timeslot_model_1.TimeSlot.findByIdAndDelete(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Time slot not found or already deleted');
    }
    return result;
});
exports.timeSlotServices = {
    createTimeSlot: exports.createTimeSlot,
    getAllTimeSlots,
    getSingleTimeSlot,
    updateTimeSlot,
    deleteTimeSlot,
};
