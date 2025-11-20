import express from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
// import { auth } from '../../middlewares/auth';
import { feeCategoryControllers } from './controller';
import {
  createFeeCategoryValidation,
  updateFeeCategoryValidation,
} from './validation';

const router = express.Router();

router.post(
  '/',
  // auth('admin', 'super_admin'),
  validateRequest(createFeeCategoryValidation),
  feeCategoryControllers.createFeeCategory,
);

router.get('/', feeCategoryControllers.getAllFeeCategories);

router.get('/:id', feeCategoryControllers.getSingleFeeCategory);

router.patch(
  '/:id',
  // auth('admin', 'super_admin'),
  validateRequest(updateFeeCategoryValidation),
  feeCategoryControllers.updateFeeCategory,
);

router.delete(
  '/:id',
  // auth('admin', 'super_admin'),
  feeCategoryControllers.deleteFeeCategory,
);

export const feeCategoryRoutes = router;
