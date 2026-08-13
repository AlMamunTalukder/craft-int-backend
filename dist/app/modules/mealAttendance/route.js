"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mealAttendanceRoutes = void 0;
const express_1 = __importDefault(require("express"));
const controller_1 = require("./controller");
const router = express_1.default.Router();
// Bulk create / upsert attendance (used by both Add and Update forms)
router.post('/bulk', controller_1.mealAttendanceControllers.bulkCreateAttendance);
// Delete all attendance for a month (personType + className aware)
router.delete('/bulk/month', controller_1.mealAttendanceControllers.deleteMonthlyAttendance);
// List records (table view) - personType + className aware
router.get('/all', controller_1.mealAttendanceControllers.getAllAttendanceRecords);
// Monthly sheet (used to pre-populate Add/Update grids) - personType aware
router.get('/sheet', controller_1.mealAttendanceControllers.getMonthlyAttendanceSheet);
// Monthly summary/report - personType aware
router.get('/summary', controller_1.mealAttendanceControllers.getMonthlySummary);
// Legacy: single student monthly report
router.get('/student/:studentId/:month/:academicYear', controller_1.mealAttendanceControllers.getAttendanceByStudentAndMonth);
router.get('/monthly-sheet/combined', controller_1.mealAttendanceControllers.getCombinedMonthlySheet);
// Single record CRUD
router.get('/:id', controller_1.mealAttendanceControllers.getAttendanceById);
router.put('/:id', controller_1.mealAttendanceControllers.updateAttendance);
router.delete('/:id', controller_1.mealAttendanceControllers.deleteAttendance);
exports.mealAttendanceRoutes = router;
