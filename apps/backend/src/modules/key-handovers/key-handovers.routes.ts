import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createHandoverSchema, handoverIdParamSchema, handoverQuerySchema } from './key-handovers.validation';
import { createHandover, listHandovers, getHandover, confirmFrom, confirmTo } from './key-handovers.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

router.post('/', requirePermission('manage_key_handovers'), validateBody(createHandoverSchema), createHandover);
router.get('/', requirePermission('view_key_handovers'), validateQuery(handoverQuerySchema), listHandovers);
router.get('/:id', requirePermission('view_key_handovers'), validateParams(handoverIdParamSchema), getHandover);
router.patch('/:id/confirm-from', requirePermission('manage_key_handovers'), validateParams(handoverIdParamSchema), confirmFrom);
router.patch('/:id/confirm-to', requirePermission('manage_key_handovers'), validateParams(handoverIdParamSchema), confirmTo);

export default router;
