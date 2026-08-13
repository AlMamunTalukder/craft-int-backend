"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dailyClassReportRoutes = void 0;
const express_1 = __importDefault(require("express"));
const dailyClassReport_controller_1 = require("./dailyClassReport.controller");
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_1 = require("../../middlewares/auth");
const dailyClassReport_validation_1 = require("./dailyClassReport.validation");
const router = express_1.default.Router();
router.post('/', (0, auth_1.auth)('admin', 'teacher', 'super_admin'), (0, validateRequest_1.validateRequest)(dailyClassReport_validation_1.DailyClassReportValidations.createReportValidation), dailyClassReport_controller_1.dailyClassReportControllers.createDailyClassReport);
router.get('/', dailyClassReport_controller_1.dailyClassReportControllers.getAllDailyClassReports);
router.get('/:id', dailyClassReport_controller_1.dailyClassReportControllers.getSingleDailyClassReport);
router.patch('/:id', (0, auth_1.auth)('admin', 'teacher', 'super_admin'), (0, validateRequest_1.validateRequest)(dailyClassReport_validation_1.DailyClassReportValidations.updateReportValidation), dailyClassReport_controller_1.dailyClassReportControllers.updateDailyClassReport);
router.delete('/:id', (0, auth_1.auth)('admin', 'super_admin'), dailyClassReport_controller_1.dailyClassReportControllers.deleteDailyClassReport);
exports.dailyClassReportRoutes = router;
