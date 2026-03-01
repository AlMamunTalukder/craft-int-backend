import express from 'express';
import { feesControllers } from './controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { createFeeSchema } from './validation';

const router = express.Router();
router.post(
  '/students/:studentId/fees',
  validateRequest(createFeeSchema),
  feesControllers.createSingleFee,
);
router.get('/due', feesControllers.getAllDueFees);
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

export const feesRoutes = router;
