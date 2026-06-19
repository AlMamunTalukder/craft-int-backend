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
    getStudentMealBalance,
    getAllStudentsMealBalance,
} from './mealBalance.controller';

const router = express.Router();

router.post('/generate-all', generateMonthlyMealFees);
router.post('/generate-single/:studentId', generateSingleStudentMealFee);
router.get('/student/:studentId', getStudentMealFees);
router.get('/monthly/:month/:year', getMonthlyMealFees);
router.get('/summary', checkMealAttendanceSummary);

// Balance ledger routes
router.get('/balance/student/:studentId', getStudentMealBalance);
router.get('/balance/all', getAllStudentsMealBalance);


router.get('/debug/attendance/:studentId', debugAttendance);


router.delete('/delete-fee/:feeId', deleteMealFee);
router.delete('/delete-month/:month/:year', deleteMonthlyMealFees);

export const mealFeeRoute = router;