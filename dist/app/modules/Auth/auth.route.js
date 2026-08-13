"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = void 0;
const express_1 = __importDefault(require("express"));
const auth_validation_1 = require("./auth.validation");
const auth_controller_1 = require("./auth.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_1 = require("../../middlewares/auth");
const router = express_1.default.Router();
router.post('/login', (0, validateRequest_1.validateRequest)(auth_validation_1.AuthValidation.loginValidationSchema), auth_controller_1.AuthController.loginUser);
router.post('/change-password', (0, auth_1.auth)(), (0, validateRequest_1.validateRequest)(auth_validation_1.AuthValidation.changePasswordValidationSchema), auth_controller_1.AuthController.changePassword);
router.post('/refresh-token', auth_controller_1.AuthController.refreshToken);
router.post('/logout', auth_controller_1.AuthController.logoutUser);
router.get('/me', (0, auth_1.auth)('admin', 'super_admin', 'teacher', 'student', 'class_teacher', 'accountant'), auth_controller_1.AuthController.getMe);
exports.authRoutes = router;
