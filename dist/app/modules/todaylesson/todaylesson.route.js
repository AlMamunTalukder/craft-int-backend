"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.todayLessonRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_1 = require("../../middlewares/auth");
const todaylesson_validation_1 = require("./todaylesson.validation");
const todaylesson_controller_1 = require("./todaylesson.controller");
const router = express_1.default.Router();
router.post('/', (0, auth_1.auth)('admin', 'super_admin', 'teacher'), (0, validateRequest_1.validateRequest)(todaylesson_validation_1.TodayLessonValidations.createTodayLessonValidation), todaylesson_controller_1.todayLessonControllers.createTodayLesson);
router.get('/', todaylesson_controller_1.todayLessonControllers.getAllTodayLessons);
router.get('/:id', todaylesson_controller_1.todayLessonControllers.getSingleTodayLesson);
router.patch('/:id', (0, auth_1.auth)('admin', 'super_admin', 'teacher'), (0, validateRequest_1.validateRequest)(todaylesson_validation_1.TodayLessonValidations.updateTodayLessonValidation), todaylesson_controller_1.todayLessonControllers.updateTodayLesson);
router.delete('/:id', (0, auth_1.auth)('admin', 'super_admin', 'teacher'), todaylesson_controller_1.todayLessonControllers.deleteTodayLesson);
exports.todayLessonRoutes = router;
