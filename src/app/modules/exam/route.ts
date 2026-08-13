import express from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
import { auth } from '../../middlewares/auth';
import { examControllers } from './controller';
import { examValidations } from './validation';

const router = express.Router();

router.post(
  '/',
  auth('admin', 'super_admin', 'class_teacher'),
  validateRequest(examValidations.createExamValidation),
  examControllers.createExam,
);

router.get('/', examControllers.getAllExams);

router.get('/marks', examControllers.getMarks);
router.get('/result/:examId', examControllers.getResults);

router.post(
  '/marks/bulk',
  auth('admin', 'super_admin', 'class_teacher'),
  validateRequest(examValidations.upsertMarksValidation),
  examControllers.upsertMarks,
);

router.get('/:id', examControllers.getSingleExam);

router.patch(
  '/:id/publish',
  auth('admin', 'super_admin'),
  validateRequest(examValidations.publishExamValidation),
  examControllers.publishExam,
);

router.patch(
  '/:id',
  auth('admin', 'super_admin', 'class_teacher'),
  validateRequest(examValidations.updateExamValidation),
  examControllers.updateExam,
);

router.delete('/:id', auth('admin', 'super_admin'), examControllers.deleteExam);

export const examRoutes = router;
