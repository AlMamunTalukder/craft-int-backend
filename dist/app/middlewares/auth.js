"use strict";
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
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
exports.auth = void 0;
const http_status_1 = __importDefault(require("http-status"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const catchAsync_1 = require("../../utils/catchAsync");
const AppError_1 = require("../error/AppError");
const config_1 = __importDefault(require("../config"));
const user_model_1 = require("../modules/user/user.model");
const mongoose_1 = __importDefault(require("mongoose"));
const auth = (...requiredRoles) => {
    return (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a, _b;
        const token = (_a = req.cookies) === null || _a === void 0 ? void 0 : _a.accessToken;
        const authHeaderToken = ((_b = req.headers.authorization) === null || _b === void 0 ? void 0 : _b.startsWith('Bearer '))
            ? req.headers.authorization.split(' ')[1]
            : null;
        const finalToken = token || authHeaderToken;
        if (!finalToken) {
            throw new AppError_1.AppError(http_status_1.default.UNAUTHORIZED, 'You are not authorized! Please login to get access');
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(finalToken, config_1.default.jwt_access_secret);
            const { role, userId, iat, email } = decoded;
            let user = yield user_model_1.User.findOne({
                $or: [{ userId: userId }, { email: email }],
            });
            if (!user && mongoose_1.default.Types.ObjectId.isValid(userId)) {
                user = yield user_model_1.User.findById(userId);
            }
            if (!user) {
                throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'This user is not found');
            }
            const isDeleted = user === null || user === void 0 ? void 0 : user.isDeleted;
            if (isDeleted) {
                throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'This user is deleted!');
            }
            const userStatus = user === null || user === void 0 ? void 0 : user.status;
            if (userStatus === 'inactive') {
                throw new AppError_1.AppError(http_status_1.default.NOT_FOUND, 'This user is blocked!');
            }
            if (user.passwordChangeAt &&
                user_model_1.User.isJWTIssuedBeforePasswordChanged(user.passwordChangeAt, iat)) {
                throw new AppError_1.AppError(http_status_1.default.UNAUTHORIZED, 'You are not authorized!');
            }
            if (requiredRoles.length > 0 && !requiredRoles.includes(role)) {
                throw new AppError_1.AppError(http_status_1.default.UNAUTHORIZED, 'You are not authorized user!');
            }
            req.user = {
                userId: user.userId,
                _id: user._id,
                role: user.role,
                email: user.email,
                name: user.name,
            };
            next();
        }
        catch (error) {
            if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
                throw new AppError_1.AppError(http_status_1.default.UNAUTHORIZED, 'Invalid token!');
            }
            if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
                throw new AppError_1.AppError(http_status_1.default.UNAUTHORIZED, 'Token expired!');
            }
            throw error;
        }
    }));
};
exports.auth = auth;
