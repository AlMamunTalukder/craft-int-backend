import express from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
import { auth } from '../../middlewares/auth';
import { enrollmentControllers } from './controller';
import { enrollmentValidationSchema } from './validation';

const router = express.Router();

// CRUD routes (existing)
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

// // Promotion routes
// router.post(
//   '/promote',
//   auth('admin', 'super_admin'),
//   enrollmentControllers.promoteEnrollment,
// );

// router.post(
//   '/bulk-promote',
//   auth('admin', 'super_admin'),
//   enrollmentControllers.bulkPromoteEnrollments,
// );

// router.get(
//   '/promotion/history/:studentId',
//   auth('admin', 'super_admin'),
//   enrollmentControllers.getPromotionHistory,
// );

// router.get(
//   '/promotion/eligible',
//   auth('admin', 'super_admin'),
//   enrollmentControllers.getPromotionEligibleStudents,
// );

// router.get(
//   '/promotion/summary',
//   auth('admin', 'super_admin'),
//   enrollmentControllers.getPromotionSummary,
// );

export const enrollmentRoutes = router;
