import express from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
import { auth } from '../../middlewares/auth';
import { enrollmentControllers } from './controller';
import { enrollmentValidationSchema } from './validation';

const router = express.Router();

// CRUD
router.post(
  '/',
  // auth('admin', 'super_admin'),
  validateRequest(enrollmentValidationSchema),
  enrollmentControllers.createEnrollment,
);
router.get('/', enrollmentControllers.getAllEnrollments);
router.get('/:id', enrollmentControllers.getSingleEnrollment);
router.patch(
  '/:id',
  auth('admin', 'super_admin'),
  validateRequest(enrollmentValidationSchema),
  enrollmentControllers.updateEnrollment,
);
router.delete(
  '/:id',
  auth('admin', 'super_admin'),
  enrollmentControllers.deleteEnrollment,
);


router.post(
  '/promote',
  auth('admin', 'super_admin'),
  enrollmentControllers.promoteEnrollment,
);

export const enrollmentRoutes = router;
