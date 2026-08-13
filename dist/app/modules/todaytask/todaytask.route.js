"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.todayTaskRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_1 = require("../../middlewares/auth");
const todaytask_controller_1 = require("./todaytask.controller");
const todaytask_validation_1 = require("./todaytask.validation");
const router = express_1.default.Router();
router.post('/', (0, auth_1.auth)('admin', 'super_admin', 'teacher'), (0, validateRequest_1.validateRequest)(todaytask_validation_1.TodayTaskValidations.createTodayTaskValidation), todaytask_controller_1.todayTaskControllers.createTodayTask);
router.get('/', todaytask_controller_1.todayTaskControllers.getAllTodayTasks);
router.get('/:id', todaytask_controller_1.todayTaskControllers.getSingleTodayTask);
router.patch('/:id', (0, auth_1.auth)('admin', 'super_admin', 'teacher'), (0, validateRequest_1.validateRequest)(todaytask_validation_1.TodayTaskValidations.updateTodayTaskValidation), todaytask_controller_1.todayTaskControllers.updateTodayTask);
router.delete('/:id', (0, auth_1.auth)('admin', 'super_admin', 'teacher'), todaytask_controller_1.todayTaskControllers.deleteTodayTask);
exports.todayTaskRoutes = router;
