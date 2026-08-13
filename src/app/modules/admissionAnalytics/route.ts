import express from 'express';
import { admissionAnalyticsControllers } from './controller';

const router = express.Router();

router.get('/', admissionAnalyticsControllers.getAdmissionStats);

export const admissionAnalyticsRoutes = router;
