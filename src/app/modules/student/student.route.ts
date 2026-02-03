/* eslint-disable @typescript-eslint/no-unused-vars */
import express from 'express';
import { studentControllers } from './student.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { createStudentValidation } from './student.validation';

const router = express.Router();

router.post(
  '/',
  validateRequest(createStudentValidation),
  studentControllers.createStudent,
);

router.get('/', studentControllers.getAllStudents);

router.get('/:id', studentControllers.getSingleStudent);

router.delete('/:id', studentControllers.deleteStudent);

router.patch(
  '/:id',

  studentControllers.updateStudent,
);

export const studentRoutes = router;
