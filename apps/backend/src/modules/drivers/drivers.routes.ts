import { Router } from 'express';
import { validateBody, validateParams } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';

import {
  createDriverSchema,
  updateDriverSchema,
  driverIdParamSchema,
} from './drivers.validation';

import {
  createDriver,
  listDrivers,
  getDriver,
  updateDriver,
  deleteDriver,
} from './drivers.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/drivers:
 *   post:
 *     summary: Create a new driver
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - licenseNumber
 *               - licenseExpiry
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               licenseNumber:
 *                 type: string
 *               licenseExpiry:
 *                 type: string
 *                 format: date-time
 *               experience:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Driver created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       409:
 *         description: License number already exists
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  requirePermission('drivers:create'),
  validateBody(createDriverSchema),
  createDriver
);

/**
 * @swagger
 * /api/v1/drivers:
 *   get:
 *     summary: List all drivers
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or license number
 *     responses:
 *       200:
 *         description: List of drivers
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.get(
  '/',
  requirePermission('drivers:read'),
  listDrivers
);

/**
 * @swagger
 * /api/v1/drivers/{id}:
 *   get:
 *     summary: Get driver by ID
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Driver ID
 *     responses:
 *       200:
 *         description: Driver details
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Driver not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:id',
  requirePermission('drivers:read'),
  validateParams(driverIdParamSchema),
  getDriver
);

/**
 * @swagger
 * /api/v1/drivers/{id}:
 *   patch:
 *     summary: Update driver
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Driver ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               licenseNumber:
 *                 type: string
 *               licenseExpiry:
 *                 type: string
 *                 format: date-time
 *               experience:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Driver updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Driver not found
 *       500:
 *         description: Server error
 */
router.patch(
  '/:id',
  requirePermission('drivers:update'),
  validateParams(driverIdParamSchema),
  validateBody(updateDriverSchema),
  updateDriver
);

/**
 * @swagger
 * /api/v1/drivers/{id}:
 *   delete:
 *     summary: Delete driver (soft delete)
 *     tags: [Drivers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Driver ID
 *     responses:
 *       200:
 *         description: Driver deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Driver not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id',
  requirePermission('drivers:delete'),
  validateParams(driverIdParamSchema),
  deleteDriver
);

export default router;