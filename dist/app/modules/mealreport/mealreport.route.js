"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mealReportRoutes = void 0;
const express_1 = __importDefault(require("express"));
const validateRequest_1 = require("../../middlewares/validateRequest");
const mealreport_validation_1 = require("./mealreport.validation");
const mealreport_controller_1 = require("./mealreport.controller");
const router = express_1.default.Router();
router.post('/', 
// auth('admin', 'super_admin'),
(0, validateRequest_1.validateRequest)(mealreport_validation_1.MealReportValidations.createMealReportValidation), mealreport_controller_1.mealReportControllers.createMealReport);
router.get('/', mealreport_controller_1.mealReportControllers.getAllMealReports);
router.get('/:id', mealreport_controller_1.mealReportControllers.getSingleMealReport);
router.delete('/:id', 
// auth('admin', 'super_admin'),
mealreport_controller_1.mealReportControllers.deleteMealReport);
router.patch('/:id', 
// auth('admin', 'super_admin', 'teacher'),
(0, validateRequest_1.validateRequest)(mealreport_validation_1.MealReportValidations.updateMealReportValidation), mealreport_controller_1.mealReportControllers.updateMealReport);
exports.mealReportRoutes = router;
