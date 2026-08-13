import express from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
import { auth } from '../../middlewares/auth';
import { leaveControllers } from './controller';
import { leaveValidations } from './validation';

const router = express.Router();

router.post(
  '/',
  auth('admin', 'super_admin'),
  validateRequest(leaveValidations.createLeaveValidation),
  leaveControllers.createLeave,
);

router.get('/', leaveControllers.getAllLeaves);

router.patch(
  '/:id/status',
  auth('admin', 'super_admin'),
  validateRequest(leaveValidations.updateLeaveStatusValidation),
  leaveControllers.updateLeaveStatus,
);

router.get('/:id', leaveControllers.getSingleLeave);

router.patch(
  '/:id',
  auth('admin', 'super_admin'),
  validateRequest(leaveValidations.updateLeaveValidation),
  leaveControllers.updateLeave,
);

router.delete('/:id', auth('admin', 'super_admin'), leaveControllers.deleteLeave);

export const leaveRoutes = router;
