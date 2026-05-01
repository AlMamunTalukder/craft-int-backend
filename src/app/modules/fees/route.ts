import express from 'express';
import { feesControllers } from './controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { createFeeSchema } from './validation';
import { getFeeDetailsByMonth, getFeeGenerationStatus, getStudentFeeStatus, triggerFeeGeneration } from './feeGeneration.controller';

const router = express.Router();
router.post(
  '/students/:studentId/fees',
  validateRequest(createFeeSchema),
  feesControllers.createSingleFee,
);
router.get('/class-summary', feesControllers.getClassWiseFeeSummary);
router.get('/due', feesControllers.getStudentDueFees);
router.post('/create-monthly', feesControllers.createMonthlyFees);
router.post('/create-bulk-monthly', feesControllers.createBulkMonthlyFees);
router.post('/pay', feesControllers.payFee);
router.post('/pay-with-advance', feesControllers.payFeeWithAdvance);
router.get('/student-due/:studentId', feesControllers.getStudentDueFees);
router.get(
  '/monthly-status/:studentId/:month/:year',
  feesControllers.getMonthlyFeeStatus,
);
router.get('/', feesControllers.getAllFees);
router.get('/:id', feesControllers.getSingleFee);
router.patch('/:id', feesControllers.updateFee);
router.delete('/:id', feesControllers.deleteFee);

router.post('/generate', triggerFeeGeneration);

// 2. সার্ভারের ফি জেনারেশন স্ট্যাটাস দেখার জন্য
router.get('/status', getFeeGenerationStatus);

// 3. একটি নির্দিষ্ট স্টুডেন্টের ফি স্ট্যাটাস দেখার জন্য
router.get('/student/:studentId', getStudentFeeStatus);

// 4. একটি নির্দিষ্ট মাসের সব ফি দেখার জন্য (Report)
router.get('/details/:month/:year', getFeeDetailsByMonth);
export const feesRoutes = router;
