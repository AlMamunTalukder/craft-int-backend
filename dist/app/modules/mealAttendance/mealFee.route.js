"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mealFeeRoute = void 0;
const express_1 = __importDefault(require("express"));
const mealBalance_controller_1 = require("./mealBalance.controller");
const router = express_1.default.Router();
router.post('/generate-all', mealBalance_controller_1.generateMonthlyMealFees);
router.post('/generate-single/:studentId', mealBalance_controller_1.generateSingleStudentMealFee);
router.get('/student/:studentId', mealBalance_controller_1.getStudentMealFees);
router.get('/monthly/:month/:year', mealBalance_controller_1.getMonthlyMealFees);
router.get('/summary', mealBalance_controller_1.checkMealAttendanceSummary);
// Balance ledger routes
router.get('/balance/student/:studentId', mealBalance_controller_1.getStudentMealBalance);
router.get('/balance/all', mealBalance_controller_1.getAllStudentsMealBalance);
router.get('/debug/attendance/:studentId', mealBalance_controller_1.debugAttendance);
router.delete('/delete-fee/:feeId', mealBalance_controller_1.deleteMealFee);
router.delete('/delete-month/:month/:year', mealBalance_controller_1.deleteMonthlyMealFees);
exports.mealFeeRoute = router;
