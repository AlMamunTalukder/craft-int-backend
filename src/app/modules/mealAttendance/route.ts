import express from 'express';
import { mealAttendanceControllers } from './controller';

const router = express.Router();

// Bulk create / upsert attendance (used by both Add and Update forms)
router.post('/bulk', mealAttendanceControllers.bulkCreateAttendance);

// Delete all attendance for a month (personType + className aware)
router.delete('/bulk/month', mealAttendanceControllers.deleteMonthlyAttendance);

// List records (table view) - personType + className aware
router.get('/all', mealAttendanceControllers.getAllAttendanceRecords);

// Monthly sheet (used to pre-populate Add/Update grids) - personType aware
router.get('/sheet', mealAttendanceControllers.getMonthlyAttendanceSheet);

// Monthly summary/report - personType aware
router.get('/summary', mealAttendanceControllers.getMonthlySummary);

// Legacy: single student monthly report
router.get(
    '/student/:studentId/:month/:academicYear',
    mealAttendanceControllers.getAttendanceByStudentAndMonth,
);

// Single record CRUD
router.get('/:id', mealAttendanceControllers.getAttendanceById);
router.put('/:id', mealAttendanceControllers.updateAttendance);
router.delete('/:id', mealAttendanceControllers.deleteAttendance);

export const mealAttendanceRoutes = router;