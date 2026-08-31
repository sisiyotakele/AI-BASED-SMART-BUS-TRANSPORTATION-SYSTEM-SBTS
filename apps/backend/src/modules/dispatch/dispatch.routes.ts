import { Router } from 'express';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { generateTrips } from './dispatch.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/dispatch/generate:
 *   post:
 *     summary: Automagically generate trips based on schedules and assignments
 *     tags: [Dispatch]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Dispatch generated successfully
 */
router.post('/generate', requirePermission('manage_shifts'), generateTrips); // Dispatch requires high level permission

export default router;
