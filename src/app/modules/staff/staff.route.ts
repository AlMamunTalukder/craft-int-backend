import express from 'express';
import { staffControllers } from './staff.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { auth } from '../../middlewares/auth';
import { StaffValidations } from './staff.validation';

const router = express.Router();

router.post(
  '/',
  // auth('admin', 'super_admin', 'staff', 'student'),
  // validateRequest(StaffValidations.createStaffValidation),
  staffControllers.createStaff,
);

router.get('/', staffControllers.getAllStaffs);

router.get('/:id', staffControllers.getSingleStaff);

router.delete(
  '/:id',
  // auth('admin', 'super_admin'),
  staffControllers.deleteStaff,
);

router.patch(
  '/:id',
  // auth('admin', 'super_admin', 'staff'),
  // validateRequest(StaffValidations.updateStaffValidation),
  staffControllers.updateStaff,
);


export const staffRoutes = router;