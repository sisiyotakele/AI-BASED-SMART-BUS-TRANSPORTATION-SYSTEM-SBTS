import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createShiftSchema, updateShiftSchema, shiftIdParamSchema, listShiftsQuerySchema } from './shifts.validation';
import { createShift, listShifts, getShift, updateShift, deleteShift } from './shifts.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

router.post('/', requirePermission('manage_shifts'), validateBody(createShiftSchema), createShift);
router.get('/', requirePermission('view_shifts'), validateQuery(listShiftsQuerySchema), listShifts);
router.get('/:id', requirePermission('view_shifts'), validateParams(shiftIdParamSchema), getShift);
router.patch('/:id', requirePermission('manage_shifts'), validateParams(shiftIdParamSchema), validateBody(updateShiftSchema), updateShift);
router.delete('/:id', requirePermission('manage_shifts'), validateParams(shiftIdParamSchema), deleteShift);

export default router;
