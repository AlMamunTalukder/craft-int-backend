import express from 'express';
import { lateFeeControllers } from './latefeeControler';

const router = express.Router();

// Configuration
router.get('/config', lateFeeControllers.getConfig);
router.post('/config', lateFeeControllers.updateConfig);

// Manual calculation
router.post('/calculate-daily', lateFeeControllers.calculateDailyLateFees);

// Customization
router.post('/customize/:feeId', lateFeeControllers.customizeLateFee);
router.post(
  '/bulk-customize/student/:studentId',
  lateFeeControllers.bulkCustomizeStudentLateFees,
);

// History and summary
router.get('/history/:feeId', lateFeeControllers.getCustomizationHistory);
router.get('/summary/:feeId', lateFeeControllers.getFeeDueSummary);

export const lateFeeRoutes = router;
