import { Router } from 'express';
import { validateBody, validateParams, validateQuery } from '@/common/validate';
import { authenticate } from '@/common/middleware/auth.middleware';
import { requirePermission } from '@/modules/rbac';
import { createModelSchema, modelIdParamSchema, predictionQuerySchema } from './ai-prediction.validation';
import { createModel, listModels, getActiveModel, activateModel, getPrediction, createPrediction } from './ai-prediction.controller';

const router = Router();

// Apply authentication to all routes
router.use(authenticate);

router.post('/models', requirePermission('manage_ai_models'), validateBody(createModelSchema), createModel);
router.get('/models', requirePermission('view_predictions'), listModels);
router.get('/models/active', requirePermission('view_predictions'), getActiveModel);
router.patch('/models/:id/activate', requirePermission('manage_ai_models'), validateParams(modelIdParamSchema), activateModel);
router.get('/predictions', requirePermission('view_predictions'), validateQuery(predictionQuerySchema), getPrediction);
router.post('/predictions', requirePermission('manage_ai_models'), createPrediction);

export default router;
