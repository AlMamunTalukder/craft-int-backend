// app/modules/mealAttendance/mealBalance.route.ts
import express from 'express';
import {
    generateMonthlyMealFees,
    generateSingleStudentMealFee,
    getStudentMealFees,
    getMonthlyMealFees,
    checkMealAttendanceSummary,
    deleteMealFee,
    deleteMonthlyMealFees,
    debugAttendance,
} from './mealBalance.controller';

const router = express.Router();

// Main routes
router.post('/generate-all', generateMonthlyMealFees);
router.post('/generate-single/:studentId', generateSingleStudentMealFee);
router.get('/student/:studentId', getStudentMealFees);
router.get('/monthly/:month/:year', getMonthlyMealFees);
router.get('/summary', checkMealAttendanceSummary);

// Debug routes
router.get('/debug/attendance/:studentId', debugAttendance);

// Delete routes
router.delete('/delete-fee/:feeId', deleteMealFee);
router.delete('/delete-month/:month/:year', deleteMonthlyMealFees);

export const mealFeeRoute = router;