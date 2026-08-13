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
exports.User = void 0;
/* eslint-disable @typescript-eslint/no-this-alias */
const mongoose_1 = require("mongoose");
const bcrypt_1 = __importDefault(require("bcrypt"));
const config_1 = __importDefault(require("../../config"));
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
    },
    password: {
        type: String,
    },
    userId: {
        type: String,
        // required: true,
    },
    passwordChangeAt: {
        type: Date,
        default: new Date(),
    },
    needPasswordChange: {
        type: Boolean,
        default: true,
    },
    role: {
        type: String,
        enum: [
            'super_admin',
            'user',
            'admin',
            'student',
            'teacher',
            'super_visor',
            'class_teacher',
            'accountant',
            'staff'
        ],
        default: 'user',
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active',
    },
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});
userSchema.pre('save', function (next) {
    return __awaiter(this, void 0, void 0, function* () {
        const user = this;
        if (user.password && !user.password.startsWith('$2')) {
            user.password = yield bcrypt_1.default.hash(user.password, Number(config_1.default.bcrypt_salt_round) || 10);
        }
        next();
    });
});
// set '' after saving password
userSchema.post('save', function (doc, next) {
    doc.password = '';
    next();
});
userSchema.statics.isUserExistsByCustomId = function (email) {
    return __awaiter(this, void 0, void 0, function* () {
        const isUserExists = yield exports.User.findOne({ email }).select('+password');
        return isUserExists;
    });
};
userSchema.statics.isPasswordMatched = function (plaingTextPassword, hashedPassword) {
    return __awaiter(this, void 0, void 0, function* () {
        return yield bcrypt_1.default.compare(plaingTextPassword, hashedPassword);
    });
};
userSchema.statics.isJWTIssuedBeforePasswordChanged = function (passwordChangedTimestamp, jwtIssuedTimestamp) {
    const passwordChangedTime = new Date(passwordChangedTimestamp).getTime() / 1000;
    return passwordChangedTime > jwtIssuedTimestamp;
};
userSchema.statics.isUserExistsByCredential = function (credential) {
    return __awaiter(this, void 0, void 0, function* () {
        const isUserExists = yield exports.User.findOne({
            $or: [{ email: credential }, { userId: credential }],
        }).select('+password');
        return isUserExists;
    });
};
exports.User = (0, mongoose_1.model)('User', userSchema);
