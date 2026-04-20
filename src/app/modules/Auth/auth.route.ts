import express from 'express';
import { AuthValidation } from './auth.validation';
import { AuthController } from './auth.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { auth } from '../../middlewares/auth';

const router = express.Router();

router.post(
  '/login',
  validateRequest(AuthValidation.loginValidationSchema),
  AuthController.loginUser,
);

router.post(
  '/change-password',
  validateRequest(AuthValidation.changePasswordValidationSchema),
  AuthController.changePassword,
);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logoutUser);
router.get(
  '/me',
  auth(
    'admin',
    'super_admin',
    'teacher',
    'student',
    'class_teacher',
    'accountant',
  ),
  AuthController.getMe,
);
export const authRoutes = router;
