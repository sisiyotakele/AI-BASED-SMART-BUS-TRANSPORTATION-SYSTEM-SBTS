import { Router } from 'express';
import { validateBody } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import {
    trafficPredictionSchema,
    etaPredictionSchema,
    combinedPredictionSchema,
    batchPredictionSchema,
} from './ai-integration.validation';
import {
    healthCheck,
    predictTraffic,
    predictETA,
    predictCombined,
    predictBatch,
} from './ai-integration.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/ai-integration/health:
 *   get:
 *     summary: Check AI service health
 *     tags: [AI Integration]
 *     responses:
 *       200:
 *         description: AI Service is healthy
 *       503:
 *         description: AI Service unavailable
 */
router.get('/health', healthCheck);

// Apply authentication to all protected routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/ai-integration/predict/traffic:
 *   post:
 *     summary: Predict traffic conditions
 *     tags: [AI Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin_lat
 *               - origin_lon
 *               - dest_lat
 *               - dest_lon
 *             properties:
 *               origin_lat:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *               origin_lon:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *               dest_lat:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *               dest_lon:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *               route_id:
 *                 type: string
 *                 format: uuid
 *               direction:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Traffic prediction successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post(
    '/predict/traffic',
    requirePermission('view_predictions'),
    validateBody(trafficPredictionSchema),
    predictTraffic
);

/**
 * @swagger
 * /api/v1/ai-integration/predict/eta:
 *   post:
 *     summary: Predict estimated time of arrival
 *     tags: [AI Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin_lat
 *               - origin_lon
 *               - dest_lat
 *               - dest_lon
 *             properties:
 *               origin_lat:
 *                 type: number
 *               origin_lon:
 *                 type: number
 *               dest_lat:
 *                 type: number
 *               dest_lon:
 *                 type: number
 *               route_id:
 *                 type: string
 *                 format: uuid
 *               mileage:
 *                 type: number
 *               direction:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: ETA prediction successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post(
    '/predict/eta',
    requirePermission('view_predictions'),
    validateBody(etaPredictionSchema),
    predictETA
);

/**
 * @swagger
 * /api/v1/ai-integration/predict/combined:
 *   post:
 *     summary: Get combined traffic and ETA predictions
 *     tags: [AI Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin_lat
 *               - origin_lon
 *               - dest_lat
 *               - dest_lon
 *             properties:
 *               origin_lat:
 *                 type: number
 *               origin_lon:
 *                 type: number
 *               dest_lat:
 *                 type: number
 *               dest_lon:
 *                 type: number
 *               route_id:
 *                 type: string
 *                 format: uuid
 *               mileage:
 *                 type: number
 *               direction:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Combined prediction successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post(
    '/predict/combined',
    requirePermission('view_predictions'),
    validateBody(combinedPredictionSchema),
    predictCombined
);

/**
 * @swagger
 * /api/v1/ai-integration/predict/batch:
 *   post:
 *     summary: Get predictions for multiple trips in batch
 *     tags: [AI Integration]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - trips
 *             properties:
 *               trips:
 *                 type: array
 *                 minItems: 1
 *                 maxItems: 100
 *                 items:
 *                   type: object
 *                   required:
 *                     - origin_lat
 *                     - origin_lon
 *                     - dest_lat
 *                     - dest_lon
 *                   properties:
 *                     origin_lat:
 *                       type: number
 *                     origin_lon:
 *                       type: number
 *                     dest_lat:
 *                       type: number
 *                     dest_lon:
 *                       type: number
 *                     route_id:
 *                       type: string
 *                     mileage:
 *                       type: number
 *                     direction:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *     responses:
 *       200:
 *         description: Batch prediction successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
router.post(
    '/predict/batch',
    requirePermission('view_predictions'),
    validateBody(batchPredictionSchema),
    predictBatch
);

export default router;
