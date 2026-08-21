import express from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
import { auth } from '../../middlewares/auth';
import { payslipControllers } from './controller';
import { payslipValidations } from './validation';

const router = express.Router();

router.get('/summary', payslipControllers.getSummary);

router.post(
  '/generate',
  auth('admin', 'super_admin'),
  validateRequest(payslipValidations.generatePayslipsValidation),
  payslipControllers.generatePayslips,
);

router.get('/', payslipControllers.getAllPayslips);

router.patch('/:id/paid', auth('admin', 'super_admin'), payslipControllers.markPaid);

router.get('/:id', payslipControllers.getSinglePayslip);
router.delete('/:id', auth('admin', 'super_admin'), payslipControllers.deletePayslip);

export const payslipRoutes = router;
