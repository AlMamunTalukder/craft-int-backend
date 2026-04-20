import express from 'express';
import { metaController } from './meta.controller';

const router = express.Router();

router.get('/', metaController.getAllMeta);
router.get('/accounting-report', metaController.getAccountingReport);
router.get(
  '/class-wise-student-count',
  metaController.getClassWiseStudentCount,
);

export const metaRoute = router;
