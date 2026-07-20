import { z } from 'zod';
import { Router } from 'express';
import { validateBody, validateParams } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createBusSchema, updateBusSchema, busIdParamSchema } from './buses.validation';
import { createBus, listBuses, getBus, updateBus, updateMaintenance, deleteBus } from './buses.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

router.post('/', requirePermission('manage_fleet'), validateBody(createBusSchema), createBus);
router.get('/', requirePermission('view_fleet'), listBuses);
router.get('/:id', requirePermission('view_fleet'), validateParams(busIdParamSchema), getBus);
router.patch('/:id', requirePermission('manage_fleet'), validateParams(busIdParamSchema), validateBody(updateBusSchema), updateBus);
router.patch('/:id/maintenance-status', requirePermission('manage_fleet'), validateParams(busIdParamSchema), validateBody(z.object({ status: z.enum(['operational', 'in_maintenance', 'retired']) })), updateMaintenance);
router.delete('/:id', requirePermission('manage_fleet'), validateParams(busIdParamSchema), deleteBus);

export default router;
