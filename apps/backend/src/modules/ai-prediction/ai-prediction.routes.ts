import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createModelSchema, modelIdParamSchema, predictionQuerySchema } from './ai-prediction.validation';
import { createModel, listModels, getActiveModel, activateModel, getPrediction, createPrediction } from './ai-prediction.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

/**
 * @swagger
 * /api/v1/ai-prediction/models:
 *   post:
 *     summary: Create a new AI model version
 *     tags: [AI Prediction]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - version
 *               - accuracy
 *               - trainedAt
 *               - datasetSize
 *             properties:
 *               version:
 *                 type: string
 *               accuracy:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *               trainedAt:
 *                 type: string
 *                 format: date-time
 *               datasetSize:
 *                 type: integer
 *               modelParameters:
 *                 type: string
 *     responses:
 *       201:
 *         description: AI model created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       500:
 *         description: Internal server error
 */
router.post('/models', requirePermission('manage_ai_models'), validateBody(createModelSchema), createModel);

/**
 * @swagger
 * /api/v1/ai-prediction/models:
 *   get:
 *     summary: List all AI model versions
 *     tags: [AI Prediction]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Models retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       500:
 *         description: Internal server error
 */
router.get('/models', requirePermission('view_predictions'), listModels);

/**
 * @swagger
 * /api/v1/ai-prediction/models/active:
 *   get:
 *     summary: Get currently active AI model
 *     tags: [AI Prediction]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active model retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: No active model found
 *       500:
 *         description: Internal server error
 */
router.get('/models/active', requirePermission('view_predictions'), getActiveModel);

/**
 * @swagger
 * /api/v1/ai-prediction/models/{id}/activate:
 *   patch:
 *     summary: Activate a specific AI model version
 *     tags: [AI Prediction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Model ID
 *     responses:
 *       200:
 *         description: Model activated successfully
 *       400:
 *         description: Invalid model ID format
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       404:
 *         description: Model not found
 *       500:
 *         description: Internal server error
 */
router.patch('/models/:id/activate', requirePermission('manage_ai_models'), validateParams(modelIdParamSchema), activateModel);

/**
 * @swagger
 * /api/v1/ai-prediction/predictions:
 *   get:
 *     summary: Get traffic predictions for a route
 *     tags: [AI Prediction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: routeId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Route ID
 *       - in: query
 *         name: versionId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Route version ID
 *     responses:
 *       200:
 *         description: Predictions retrieved successfully
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       500:
 *         description: Internal server error
 */
router.get('/predictions', requirePermission('view_predictions'), validateQuery(predictionQuerySchema), getPrediction);

/**
 * @swagger
 * /api/v1/ai-prediction/predictions:
 *   post:
 *     summary: Create a new traffic prediction
 *     tags: [AI Prediction]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - modelId
 *               - routeId
 *               - versionId
 *               - predictionTime
 *               - trafficLevel
 *               - predictedDelayMinutes
 *               - confidence
 *             properties:
 *               modelId:
 *                 type: string
 *                 format: uuid
 *               routeId:
 *                 type: string
 *                 format: uuid
 *               versionId:
 *                 type: string
 *                 format: uuid
 *               predictionTime:
 *                 type: string
 *                 format: date-time
 *               trafficLevel:
 *                 type: string
 *                 enum: [low, moderate, high, severe]
 *               predictedDelayMinutes:
 *                 type: integer
 *               confidence:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       201:
 *         description: Prediction created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Missing required permission
 *       500:
 *         description: Internal server error
 */
router.post('/predictions', requirePermission('manage_ai_models'), createPrediction);

export default router;
