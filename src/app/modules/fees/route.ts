import express from 'express';

import { validateRequest } from '../../middlewares/validateRequest';
import { auth } from '../../middlewares/auth';

import { feesControllers } from './controller';
import { createFeeSchema } from './validation';

const router = express.Router();
router.post(
  '/',
  // auth('admin', 'super_admin'),
  validateRequest(createFeeSchema),
  feesControllers.createFees,
);
router.get('/', feesControllers.getAllFees);
router.get('/:id', feesControllers.getSingleFees);
router.patch(
  '/:id',
  auth('admin', 'super_admin'),
  feesControllers.updateFees,
);

router.delete('/:id', auth('admin', 'super_admin'), feesControllers.deleteFees);

export const feesRoutes = router;
