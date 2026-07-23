import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createAssignmentSchema, deactivateSchema, assignmentIdParamSchema, assignmentQuerySchema } from './bus-route-assignments.validation';
import { createAssignment, listAssignments, getAssignment, deactivateAssignment, deleteAssignment } from './bus-route-assignments.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

router.post('/', requirePermission('manage_assignments'), validateBody(createAssignmentSchema), createAssignment);
router.get('/', requirePermission('view_assignments'), validateQuery(assignmentQuerySchema), listAssignments);
router.get('/:id', requirePermission('view_assignments'), validateParams(assignmentIdParamSchema), getAssignment);
router.patch('/:id/deactivate', requirePermission('manage_assignments'), validateParams(assignmentIdParamSchema), validateBody(deactivateSchema), deactivateAssignment);
router.delete('/:id', requirePermission('manage_assignments'), validateParams(assignmentIdParamSchema), deleteAssignment);

export default router;
