import { NotFoundError, ConflictError } from '@/common/errors';
import { logger } from '@/common/logger';
import * as repository from './ai-prediction.repository';

export async function createModel(data: any) {
  const model = await repository.createModel({
    version: data.version,
    accuracy: data.accuracy,
    trainedAt: data.trainedAt,
    datasetSize: data.datasetSize,
    modelParameters: data.modelParameters,
    isActive: false,
  });
  logger.info('AI model registered', { modelId: model.id });
  return model;
}

export async function listModels() {
  return repository.findModels();
}

export async function getActiveModel() {
  const model = await repository.findActiveModel();
  if (!model) throw new NotFoundError('No active AI model found', 'NO_ACTIVE_MODEL');
  return model;
}

export async function activateModel(id: string) {
  const target = await repository.findModelById(id);
  if (!target) throw new NotFoundError('Model not found', 'MODEL_NOT_FOUND');

  return repository.executeTransaction(async (tx) => {
    // Deactivate current active model first
    await repository.deactivateAllModels(tx);
    const activated = await repository.updateModel(tx, id, { isActive: true });
    logger.info('AI model activated', { modelId: id });
    return activated;
  });
}

export async function getPrediction(routeId: string, versionId: string | undefined, time: Date) {
  const where: any = { routeId, predictionTime: time };
  if (versionId) where.versionId = versionId;

  const prediction = await repository.findLatestPrediction(where);

  if (!prediction) throw new NotFoundError('No prediction found for the requested slot', 'PREDICTION_NOT_FOUND');
  return prediction;
}

export async function createPrediction(data: any) {
  const prediction = await repository.createPrediction({
    modelId: data.modelId,
    routeId: data.routeId,
    versionId: data.versionId,
    predictionTime: data.predictionTime,
    trafficLevel: data.trafficLevel,
    predictedDelayMinutes: data.predictedDelayMinutes,
    confidence: data.confidence,
  });
  logger.info('Traffic prediction created', { predictionId: prediction.id });
  return prediction;
}
