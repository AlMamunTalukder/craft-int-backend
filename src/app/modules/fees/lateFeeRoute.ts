import express from 'express';
import { lateFeeControllers } from './latefeeControler';

const router = express.Router();

// Config
router.get('/config', lateFeeControllers.getConfig);
router.patch('/config', lateFeeControllers.updateConfig);

// Daily calculation (manual trigger)
router.post('/calculate-daily', lateFeeControllers.calculateDailyLateFees);

// Late fee customization
router.patch('/customize/:feeId', lateFeeControllers.customizeLateFee);
router.patch(
  '/bulk-customize/student/:studentId',
  lateFeeControllers.bulkCustomizeStudentLateFees,
);

// History & summary
router.get('/history/:feeId', lateFeeControllers.getCustomizationHistory);
router.get('/summary/:feeId', lateFeeControllers.getFeeDueSummary);

// Optional: list all late fees for a student
router.get('/student/:studentId', lateFeeControllers.getStudentLateFees);

export const lateFeeRoutes = router;
