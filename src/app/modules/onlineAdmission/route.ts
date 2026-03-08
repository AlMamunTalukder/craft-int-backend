import express from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
import { AdmissionApplicationValidations } from './validation';
import { admissionApplicationControllers } from './controller';
const router = express.Router();

router.post('/', admissionApplicationControllers.createAdmissionApplication);

router.get(
  '/',
  // auth('admin', 'super_admin'),
  admissionApplicationControllers.getAllAdmissionApplications,
);

router.get(
  '/:id',
  // auth('admin', 'super_admin'),
  admissionApplicationControllers.getSingleAdmissionApplication,
);

router.patch(
  '/:id',
  // auth('admin', 'super_admin'),
  validateRequest(
    AdmissionApplicationValidations.updateAdmissionApplicationValidation,
  ),
  admissionApplicationControllers.updateAdmissionApplication,
);

router.delete(
  '/:id',
  // auth('super_admin'),
  admissionApplicationControllers.deleteAdmissionApplication,
);

export const admissionApplicationRoutes = router;
