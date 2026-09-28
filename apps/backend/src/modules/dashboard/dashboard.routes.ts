import { Router } from 'express';
import * as dashboardController from './dashboard.controller';
import { authenticate } from '@/common/middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/stats', dashboardController.getStats);
router.get('/recent-activity', dashboardController.getRecentActivity);

export { router as dashboardRoutes };
