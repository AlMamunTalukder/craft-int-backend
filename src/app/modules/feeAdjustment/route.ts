import express from 'express';
import { feeAdjustmentControllers } from './controller';

const router = express.Router();

router.post('/', feeAdjustmentControllers.createFeeAdjustment);

router.post('/bulk/student', feeAdjustmentControllers.applyBulkAdjustments);

router.get(
  '/student/:studentId',
  feeAdjustmentControllers.getStudentAdjustments,
);

router.get(
  '/report/:studentId/:academicYear',
  feeAdjustmentControllers.getFeeReport,
);

router.get('/', feeAdjustmentControllers.getAllFeeAdjustments);
router.get('/:id', feeAdjustmentControllers.getSingleFeeAdjustment);

router.patch('/:id', feeAdjustmentControllers.updateFeeAdjustment);

router.delete('/:id', feeAdjustmentControllers.deleteFeeAdjustment);

export const feeAdjustmentRoutes = router;
