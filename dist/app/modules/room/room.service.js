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
exports.roomServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const QueryBuilder_1 = __importDefault(require("../../builder/QueryBuilder"));
const room_constant_1 = require("./room.constant");
const room_model_1 = require("./room.model");
const createRoom = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, description, capacity } = payload;
    if (!name || !description || !capacity) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Required fields are missing');
    }
    const existingRoom = yield room_model_1.Room.findOne({ name });
    if (existingRoom) {
        throw new AppError_1.AppError(http_status_1.default.CONFLICT, 'Room with this number already exists');
    }
    const result = yield room_model_1.Room.create(payload);
    return result;
});
const getAllRooms = (query) => __awaiter(void 0, void 0, void 0, function* () {
    const queryBuilder = new QueryBuilder_1.default(room_model_1.Room.find(), query)
        .search(room_constant_1.roomSearchableFields)
        .filter()
        .sort()
        .paginate()
        .fields();
    const meta = yield queryBuilder.countTotal();
    const rooms = yield queryBuilder.modelQuery;
    return {
        meta,
        rooms,
    };
});
const getSingleRoom = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield room_model_1.Room.findById(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Room not found');
    }
    return result;
});
const updateRoom = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield room_model_1.Room.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update room');
    }
    return result;
});
const deleteRoom = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield room_model_1.Room.findByIdAndDelete(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Room not found or already deleted');
    }
    return result;
});
exports.roomServices = {
    createRoom,
    getAllRooms,
    getSingleRoom,
    updateRoom,
    deleteRoom,
};
