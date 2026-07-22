import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createScheduleSchema, updateScheduleSchema, scheduleIdParamSchema, scheduleQuerySchema } from './schedules.validation';
import { createSchedule, listSchedules, getSchedule, updateSchedule, deleteSchedule } from './schedules.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

router.post('/', requirePermission('manage_schedules'), validateBody(createScheduleSchema), createSchedule);
router.get('/', requirePermission('view_schedules'), validateQuery(scheduleQuerySchema), listSchedules);
router.get('/:id', requirePermission('view_schedules'), validateParams(scheduleIdParamSchema), getSchedule);
router.patch('/:id', requirePermission('manage_schedules'), validateParams(scheduleIdParamSchema), validateBody(updateScheduleSchema), updateSchedule);
router.delete('/:id', requirePermission('manage_schedules'), validateParams(scheduleIdParamSchema), deleteSchedule);

export default router;
