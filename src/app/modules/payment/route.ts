import express from 'express';
import { paymentControllers } from './controller';

const router = express.Router();

router.get('/', paymentControllers.getAllPayments);
router.post('/bulk', paymentControllers.createBulkPayment);

router.get('/receipt/:paymentId', paymentControllers.generateReceipt);

router.post('/', paymentControllers.createPayment);

router.get('/:id', paymentControllers.getSinglePayment);

router.patch('/:id', paymentControllers.updatePayment);

router.delete('/:id', paymentControllers.deletePayment);

export const paymentRoutes = router;
