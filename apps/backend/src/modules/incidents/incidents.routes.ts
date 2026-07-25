import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createIncidentSchema, resolveIncidentSchema, incidentIdParamSchema, incidentQuerySchema } from './incidents.validation';
import { createIncident, listIncidents, getIncident, reviewIncident, resolveIncident, deleteIncident } from './incidents.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

router.post('/', requirePermission('report_incident'), validateBody(createIncidentSchema), createIncident);
router.get('/', requirePermission('view_incidents'), validateQuery(incidentQuerySchema), listIncidents);
router.get('/:id', requirePermission('view_incidents'), validateParams(incidentIdParamSchema), getIncident);
router.patch('/:id/review', requirePermission('review_incident'), validateParams(incidentIdParamSchema), reviewIncident);
router.patch('/:id/resolve', requirePermission('resolve_incident'), validateParams(incidentIdParamSchema), validateBody(resolveIncidentSchema), resolveIncident);
router.delete('/:id', requirePermission('delete_incident'), validateParams(incidentIdParamSchema), deleteIncident);

export default router;
