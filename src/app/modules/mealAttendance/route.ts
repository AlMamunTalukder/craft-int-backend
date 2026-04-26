
import express from 'express';
import { mealAttendanceControllers } from './controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { bulkAttendanceValidation, createAttendanceValidation } from './validation';

const router = express.Router();

router.post('/', validateRequest(createAttendanceValidation), mealAttendanceControllers.createOrUpdateAttendance);
router.post('/bulk', validateRequest(bulkAttendanceValidation), mealAttendanceControllers.bulkCreateAttendance);
router.delete('/:id', mealAttendanceControllers.deleteAttendance);
router.get('/all', mealAttendanceControllers.getAllAttendanceRecords);
router.get('/student/:studentId/history', mealAttendanceControllers.getStudentWithMealHistory);
router.get('/student/:studentId/report', mealAttendanceControllers.getStudentMealReport);
router.get('/student/:studentId/:month/:academicYear', mealAttendanceControllers.getAttendanceByStudentAndMonth);
router.get('/sheet', mealAttendanceControllers.getMonthlyAttendanceSheet);
router.get('/summary', mealAttendanceControllers.getMonthlySummary);
router.get('/date-range', mealAttendanceControllers.getAttendanceByDateRange);
router.get('/date-range/all', mealAttendanceControllers.getAttendanceByDateRangeForAllStudents);

export const mealAttendanceRoutes = router;