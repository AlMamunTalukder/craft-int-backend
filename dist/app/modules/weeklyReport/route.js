"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.weeklyReportRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const auth_1 = require("../../middlewares/auth");
const controller_1 = require("./controller");
const validation_1 = require("./validation");
const router = express_1.default.Router();
router.post('/', (0, auth_1.auth)('admin', 'super_admin'), (0, validateRequest_1.validateRequest)(validation_1.WeeklyReportValidations.createWeeklyReportValidation), controller_1.weeklyReportControllers.createWeeklyReport);
router.get('/', controller_1.weeklyReportControllers.getAllWeeklyReports);
router.get('/:id', controller_1.weeklyReportControllers.getSingleWeeklyReport);
router.patch('/:id', (0, auth_1.auth)('admin', 'super_admin'), (0, validateRequest_1.validateRequest)(validation_1.WeeklyReportValidations.updateWeeklyReportValidation), controller_1.weeklyReportControllers.updateWeeklyReport);
router.delete('/:id', (0, auth_1.auth)('admin', 'super_admin'), controller_1.weeklyReportControllers.deleteWeeklyReport);
exports.weeklyReportRoutes = router;
