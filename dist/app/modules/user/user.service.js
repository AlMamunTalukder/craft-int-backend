"use strict";
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
exports.UserServices = void 0;
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const user_model_1 = require("./user.model");
const auth_utils_1 = require("../Auth/auth.utils");
const config_1 = __importDefault(require("../../config"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const createUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    // Check if email already exists
    const existingEmail = yield user_model_1.User.findOne({ email: payload.email });
    if (existingEmail) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'Email is already registered!');
    }
    // Check if userId already exists
    const existingUserId = yield user_model_1.User.findOne({ userId: payload.userId });
    if (existingUserId) {
        throw new AppError_1.AppError(http_status_1.default.BAD_REQUEST, 'User ID is already taken!');
    }
    // Generate a unique userId if not provided
    if (!payload.userId) {
        const lastUser = yield user_model_1.User.findOne().sort({ createdAt: -1 });
        const lastId = (lastUser === null || lastUser === void 0 ? void 0 : lastUser.userId) || '0';
        const nextId = (parseInt(lastId) + 1).toString().padStart(6, '0');
        payload.userId = nextId;
    }
    // Ensure password exists
    if (!payload.password) {
        payload.password = config_1.default.default_pass || 'default123';
    }
    // Create the user
    const result = yield user_model_1.User.create(payload);
    // Create JWT payload
    const JwtPayload = {
        userId: result.userId,
        role: result.role,
        email: result.email,
        name: result.name,
    };
    // Generate tokens
    const accessToken = (0, auth_utils_1.createToken)(JwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
    const refreshToken = (0, auth_utils_1.createToken)(JwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expires_in);
    return {
        accessToken,
        refreshToken,
        user: {
            userId: result.userId,
            email: result.email,
            name: result.name,
            role: result.role,
        },
    };
});
const getAllUser = () => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_model_1.User.find();
    return result;
});
const getSingleUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_model_1.User.findById(id);
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'User not found');
    }
    return result;
});
const deleteUser = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const result = yield user_model_1.User.deleteOne({ _id: id });
    return result;
});
const updateUser = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    if (payload.password) {
        // Manually hash the new password
        payload.password = yield bcrypt_1.default.hash(payload.password, Number(config_1.default.bcrypt_salt_round));
    }
    const result = yield user_model_1.User.findByIdAndUpdate(id, payload, {
        new: true,
        runValidators: true,
    });
    if (!result) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'Failed to update user');
    }
    return result;
});
exports.UserServices = {
    createUser,
    getAllUser,
    deleteUser,
    updateUser,
    getSingleUser,
};
