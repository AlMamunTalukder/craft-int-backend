// mealAttendance/route.ts
import express from 'express';
import { mealAttendanceControllers } from './controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { bulkAttendanceValidation, createAttendanceValidation } from './validation';

const router = express.Router();

// Create or update single attendance
router.post(
  '/',
  validateRequest(createAttendanceValidation),
  mealAttendanceControllers.createOrUpdateAttendance
);

// Bulk create/update attendance
router.post(
  '/bulk',
  validateRequest(bulkAttendanceValidation),
  mealAttendanceControllers.bulkCreateAttendance
);

// Get student's monthly attendance
router.get(
  '/student',
  mealAttendanceControllers.getAttendanceByStudentAndMonth
);

// Get monthly attendance sheet by class
router.get(
  '/sheet',
  mealAttendanceControllers.getMonthlyAttendanceSheet
);

// Get monthly summary with fees calculation
router.get(
  '/summary',
  mealAttendanceControllers.getMonthlySummary
);

// Get attendance by date range for specific class
router.get(
  '/date-range',
  mealAttendanceControllers.getAttendanceByDateRange
);

// Get attendance by date range for all students
router.get(
  '/date-range/all',
  mealAttendanceControllers.getAttendanceByDateRangeForAllStudents
);

// Delete attendance record
router.delete(
  '/:id',
  mealAttendanceControllers.deleteAttendance
);

export const mealAttendanceRoutes = router;
