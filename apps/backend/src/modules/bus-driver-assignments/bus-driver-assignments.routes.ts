import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createAssignmentSchema, updateAssignmentSchema, assignmentIdParamSchema, assignmentQuerySchema } from './bus-driver-assignments.validation';
import { createAssignment, listAssignments, getAssignment, updateAssignment, deleteAssignment } from './bus-driver-assignments.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

router.post('/', requirePermission('manage_assignments'), validateBody(createAssignmentSchema), createAssignment);
router.get('/', requirePermission('view_assignments'), validateQuery(assignmentQuerySchema), listAssignments);
router.get('/:id', requirePermission('view_assignments'), validateParams(assignmentIdParamSchema), getAssignment);
router.patch('/:id', requirePermission('manage_assignments'), validateParams(assignmentIdParamSchema), validateBody(updateAssignmentSchema), updateAssignment);
router.delete('/:id', requirePermission('manage_assignments'), validateParams(assignmentIdParamSchema), deleteAssignment);

export default router;
