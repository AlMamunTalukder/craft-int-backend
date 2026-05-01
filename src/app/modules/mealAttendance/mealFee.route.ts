
import express from 'express';
import {
    generateMonthlyMealFees,
    generateSingleStudentMealFee,
    getStudentMealFees,
    getMonthlyMealFees,
    checkMealAttendanceSummary,
    deleteMealFee,
    deleteMonthlyMealFees
} from './mealBalance.controller';

const router = express.Router();

// ============================================
// টেস্টিং রাউটস (ম্যানুয়ালি টেস্ট করার জন্য)
// ============================================

// 1. সব স্টুডেন্টের মিল ফি জেনারেট করুন (যেকোনো মাসের জন্য)
// POST /api/meal-fee/test/generate-all
router.post('/test/generate-all', generateMonthlyMealFees);

// 2. নির্দিষ্ট স্টুডেন্টের মিল ফি জেনারেট করুন (টেস্ট)
// POST /api/meal-fee/test/generate-single/:studentId
router.post('/test/generate-single/:studentId', generateSingleStudentMealFee);

// 3. মিল অ্যাটেনডেন্স সামারি দেখুন (কোন মাসে কত মিল হয়েছে)
// GET /api/meal-fee/test/summary?month=5&year=2026
router.get('/test/summary', checkMealAttendanceSummary);

// 4. নির্দিষ্ট মাসের সব মিল ফি ডিলিট করুন (টেস্ট)
// DELETE /api/meal-fee/test/delete-month/:month/:year
router.delete('/test/delete-month/:month/:year', deleteMonthlyMealFees);

// 5. নির্দিষ্ট ফি ডিলিট করুন (টেস্ট)
// DELETE /api/meal-fee/test/delete-fee/:feeId
router.delete('/test/delete-fee/:feeId', deleteMealFee);

// ============================================
// প্রোডাকশন রাউটস
// ============================================

// 6. স্টুডেন্টের সব মিল ফি দেখা
// GET /api/meal-fee/student/:studentId
router.get('/student/:studentId', getStudentMealFees);

// 7. নির্দিষ্ট মাসের সব মিল ফি দেখা
// GET /api/meal-fee/monthly/:month/:year
router.get('/monthly/:month/:year', getMonthlyMealFees);


export const mealFeeRoute = router;