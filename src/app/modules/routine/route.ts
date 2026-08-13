import express from 'express';
import { validateRequest } from '../../middlewares/validateRequest';
import { auth } from '../../middlewares/auth';
import { routineControllers } from './controller';
import { routineValidations } from './validation';

const router = express.Router();

router.get('/week', routineControllers.getWeekRoutine);

router.post(
  '/',
  auth('admin', 'super_admin'),
  validateRequest(routineValidations.createRoutineValidation),
  routineControllers.createRoutine,
);

router.get('/', routineControllers.getAllRoutines);
router.get('/:id', routineControllers.getSingleRoutine);

router.patch(
  '/:id',
  auth('admin', 'super_admin'),
  validateRequest(routineValidations.updateRoutineValidation),
  routineControllers.updateRoutine,
);

router.delete('/:id', auth('admin', 'super_admin'), routineControllers.deleteRoutine);

export const routineRoutes = router;
