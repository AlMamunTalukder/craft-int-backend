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
exports.AuthServices = void 0;
/* eslint-disable @typescript-eslint/no-unused-vars */
const http_status_1 = __importDefault(require("http-status"));
const AppError_1 = require("../../error/AppError");
const auth_utils_1 = require("./auth.utils");
const config_1 = __importDefault(require("../../config"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = require("../user/user.model");
const loginUser = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.isUserExistsByCredential(payload.credential);
    if (!user) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'User not found');
    }
    if (user.isDeleted) {
        throw new AppError_1.AppError(http_status_1.default.FORBIDDEN, 'This account has been deleted!');
    }
    const isPasswordValid = yield user_model_1.User.isPasswordMatched(payload.password, user.password);
    if (!isPasswordValid) {
        throw new AppError_1.AppError(http_status_1.default.FORBIDDEN, 'Password does not match');
    }
    const JwtPayload = {
        userId: user.userId,
        role: user.role,
        email: user.email,
    };
    const accessToken = (0, auth_utils_1.createToken)(JwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
    const refreshToken = (0, auth_utils_1.createToken)(JwtPayload, config_1.default.jwt_refresh_secret, config_1.default.jwt_refresh_expires_in);
    return {
        accessToken,
        refreshToken,
        user: {
            userId: user.userId,
            email: user.email,
            name: user.name,
            role: user.role,
        },
    };
});
const refreshToken = (token) => __awaiter(void 0, void 0, void 0, function* () {
    if (!token) {
        throw new AppError_1.AppError(http_status_1.default.UNAUTHORIZED, 'Refresh token not found!');
    }
    let decoded;
    try {
        decoded = jsonwebtoken_1.default.verify(token, config_1.default.jwt_refresh_secret);
    }
    catch (_a) {
        throw new AppError_1.AppError(http_status_1.default.UNAUTHORIZED, 'Invalid or expired refresh token!');
    }
    const user = yield user_model_1.User.findOne({ userId: decoded.userId });
    if (!user || user.isDeleted) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'User not found!');
    }
    const jwtPayload = {
        userId: user.userId,
        role: user.role,
        email: user.email,
    };
    const accessToken = (0, auth_utils_1.createToken)(jwtPayload, config_1.default.jwt_access_secret, config_1.default.jwt_access_expires_in);
    return { accessToken };
});
const changePassword = (userData, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield user_model_1.User.isUserExistsByCredential(userData.userId);
    if (!user) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'This user is not found ');
    }
    const isDeleted = user === null || user === void 0 ? void 0 : user.isDeleted;
    if (isDeleted) {
        throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'This user is deleted!');
    }
    if (!(yield user_model_1.User.isPasswordMatched(payload === null || payload === void 0 ? void 0 : payload.oldPassword, user === null || user === void 0 ? void 0 : user.password))) {
        throw new AppError_1.AppError(http_status_1.default.FORBIDDEN, 'Password do not matched');
    }
    const newHashedPassword = yield bcrypt_1.default.hash(payload.newPassword, Number(config_1.default.bcrypt_salt_round) || 10);
    const result = yield user_model_1.User.findOneAndUpdate({ userId: userData.userId }, {
        password: newHashedPassword,
        needPasswordChange: false,
        passwordChangeAt: new Date(),
    }, { new: true });
    return result;
});
exports.AuthServices = {
    loginUser,
    changePassword,
    refreshToken,
};
