import express from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
import { auth } from '../../middlewares/auth';
import { certificateControllers } from './controller';
import { certificateValidations } from './validation';

const router = express.Router();

router.get('/id-cards', auth('admin', 'super_admin'), certificateControllers.getIdCards);

router.post(
  '/',
  auth('admin', 'super_admin'),
  validateRequest(certificateValidations.createCertificateValidation),
  certificateControllers.createCertificate,
);

router.get('/', certificateControllers.getAllCertificates);
router.get('/:id', certificateControllers.getSingleCertificate);

router.patch(
  '/:id',
  auth('admin', 'super_admin'),
  validateRequest(certificateValidations.updateCertificateValidation),
  certificateControllers.updateCertificate,
);

router.delete('/:id', auth('admin', 'super_admin'), certificateControllers.deleteCertificate);

export const certificateRoutes = router;
