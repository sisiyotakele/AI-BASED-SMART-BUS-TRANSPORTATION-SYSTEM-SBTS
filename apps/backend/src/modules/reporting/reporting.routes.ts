import { Router } from 'express';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { tripReport, incidentReport, fleetReport, getReports, getReportStats, createReport } from './reporting.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

router.get('/trips', requirePermission('reports:read'), tripReport);
router.get('/incidents', requirePermission('reports:read'), incidentReport);
router.get('/fleet', requirePermission('reports:read'), fleetReport);
router.get('/history', requirePermission('reports:read'), getReports);
router.get('/stats', requirePermission('reports:read'), getReportStats);
router.post('/history', requirePermission('reports:create'), createReport);

export default router;
