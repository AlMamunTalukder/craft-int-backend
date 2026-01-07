import express from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
import { enrollmentControllers } from './controller';
import { enrollmentValidationSchema } from './validation';

const router = express.Router();

router.get(
  '/eligible-for-promotion',
  enrollmentControllers.getPromotionEligibleStudents,
);

router.post(
  '/',
  validateRequest(enrollmentValidationSchema),
  enrollmentControllers.createEnrollment,
);

router.get('/', enrollmentControllers.getAllEnrollments);

router.post('/promote', enrollmentControllers.promoteEnrollment);

router.post('/bulk-promote', enrollmentControllers.bulkPromoteEnrollments);

router.get('/:id', enrollmentControllers.getSingleEnrollment);

router.patch(
  '/:id',
  validateRequest(enrollmentValidationSchema),
  enrollmentControllers.updateEnrollment,
);

router.delete('/:id', enrollmentControllers.deleteEnrollment);

router.get(
  '/promotion-history/:studentId',
  enrollmentControllers.getPromotionHistory,
);
router.post('/bulk-retain', enrollmentControllers.bulkRetainStudents);

export const enrollmentRoutes = router;
