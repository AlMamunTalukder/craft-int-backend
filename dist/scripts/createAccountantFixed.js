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
exports.createAccountantFixed = void 0;
// scripts/createAccountantFixed.ts
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = require("../app/modules/user/user.model");
const config_1 = __importDefault(require("../app/config"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const createAccountantFixed = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connect(config_1.default.database_url);
        console.log('✅ Connected to database');
        // Delete existing accountant if exists
        yield user_model_1.User.deleteMany({ email: 'accountant@gmail.com' });
        console.log('🗑️ Removed existing accountant');
        const saltRounds = Number(config_1.default.bcrypt_salt_round) || 10;
        const plainPassword = 'accountant123';
        const hashedPassword = yield bcrypt_1.default.hash(plainPassword, saltRounds);
        console.log('Password hash created:', hashedPassword.substring(0, 30) + '...');
        // Create accountant
        const accountant = yield user_model_1.User.create({
            email: 'accountant@gmail.com',
            name: 'Accountant',
            password: hashedPassword,
            userId: 'ACC001',
            role: 'accountant',
            needPasswordChange: false,
            status: 'active',
            isDeleted: false,
        });
        console.log('✅ Accountant created successfully:', {
            id: accountant._id,
            email: accountant.email,
            userId: accountant.userId,
            role: accountant.role,
        });
        // Verify the password works
        const verifyUser = yield user_model_1.User.findOne({
            email: 'accountant@gmail.com',
        }).select('+password');
        if (verifyUser) {
            const isMatch = yield bcrypt_1.default.compare('accountant123', verifyUser.password);
            console.log('🔐 Password verification test:', isMatch ? '✅ PASSED' : '❌ FAILED');
        }
        yield mongoose_1.default.disconnect();
    }
    catch (error) {
        console.error('❌ Error:', error);
    }
});
exports.createAccountantFixed = createAccountantFixed;
