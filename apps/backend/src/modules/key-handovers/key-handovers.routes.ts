import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import {
  createHandoverSchema,
  handoverIdParamSchema,
  busIdParamSchema,
  handoverQuerySchema,
} from './key-handovers.validation';
import {
  createHandover,
  listHandovers,
  getHandover,
  confirmFrom,
  confirmTo,
  rejectHandover,
  getNextDriver,
} from './key-handovers.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// POST /key-handovers — Driver A initiates a handover
router.post(
  '/',
  requirePermission('manage_key_handovers'),
  validateBody(createHandoverSchema),
  createHandover
);

// GET /key-handovers — List handovers (filterable by driverId, status, busId)
router.get(
  '/',
  requirePermission('view_key_handovers'),
  validateQuery(handoverQuerySchema),
  listHandovers
);

// GET /key-handovers/next-driver/:busId — Get next scheduled driver for a bus
router.get(
  '/next-driver/:busId',
  requirePermission('view_key_handovers'),
  validateParams(busIdParamSchema),
  getNextDriver
);

// GET /key-handovers/:id — Get single handover
router.get(
  '/:id',
  requirePermission('view_key_handovers'),
  validateParams(handoverIdParamSchema),
  getHandover
);

// PATCH /key-handovers/:id/confirm-from — Driver A confirms giving the key
router.patch(
  '/:id/confirm-from',
  requirePermission('manage_key_handovers'),
  validateParams(handoverIdParamSchema),
  confirmFrom
);

// PATCH /key-handovers/:id/confirm-to — Driver B accepts/confirms receiving the key
router.patch(
  '/:id/confirm-to',
  requirePermission('manage_key_handovers'),
  validateParams(handoverIdParamSchema),
  confirmTo
);

// PATCH /key-handovers/:id/reject — Driver B rejects the handover
router.patch(
  '/:id/reject',
  requirePermission('manage_key_handovers'),
  validateParams(handoverIdParamSchema),
  rejectHandover
);

export default router;
