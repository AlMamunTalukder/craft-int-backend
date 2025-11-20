/* eslint-disable @typescript-eslint/no-unused-vars */
import express from 'express';
import { studentControllers } from './student.controller';
import { auth } from '../../middlewares/auth';
import { validateRequest } from '../../middlewares/validateRequest';
import { createStudentValidation } from './student.validation';

const router = express.Router();

router.post(
  '/',
  // auth('admin', 'super_admin', 'teacher'),
  validateRequest(createStudentValidation),
  studentControllers.createStudent,
);

router.get('/', studentControllers.getAllStudents);

router.get('/:id', studentControllers.getSingleStudent);

router.delete(
  '/:id',
  // auth('admin', 'super_admin', 'teacher'),
  studentControllers.deleteStudent,
);

router.patch(
  '/:id',
  // auth('admin', 'super_admin', 'teacher', 'student'),

  studentControllers.updateStudent,
);

export const studentRoutes = router;
