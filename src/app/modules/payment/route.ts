import express from 'express';
import { auth } from '../../middlewares/auth';
import { paymentControllers } from './controller';


const router = express.Router();

router.post(
  '/',
  auth('admin', 'super_admin'),
  paymentControllers.createPayment
);

router.get('/', paymentControllers.getAllPayments);
router.get('/:id', paymentControllers.getSinglePayment);

router.patch(
  '/:id',
  auth('admin', 'super_admin'),
  paymentControllers.updatePayment
);

router.delete('/:id', auth('admin', 'super_admin'), paymentControllers.deletePayment);

export const paymentRoutes = router;
