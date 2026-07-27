import { prisma } from '@/prisma/client';
import { NotFoundError, ConflictError } from '@/common/errors';
import { logger } from '@/common/logger';

export async function createModel(data: any) {
  const model = await prisma.aiModel.create({
    data: {
      version: data.version,
      accuracy: data.accuracy,
      trainedAt: data.trainedAt,
      datasetSize: data.datasetSize,
      modelParameters: data.modelParameters,
      isActive: false,
    },
  });
  logger.info('AI model registered', { modelId: model.id });
  return model;
}

export async function listModels() {
  return prisma.aiModel.findMany({ where: { deletedAt: null }, orderBy: { createdAt: 'desc' } });
}

export async function getActiveModel() {
  const model = await prisma.aiModel.findFirst({ where: { isActive: true, deletedAt: null } });
  if (!model) throw new NotFoundError('No active AI model found', 'NO_ACTIVE_MODEL');
  return model;
}

export async function activateModel(id: string) {
  const target = await prisma.aiModel.findFirst({ where: { id, deletedAt: null } });
  if (!target) throw new NotFoundError('Model not found', 'MODEL_NOT_FOUND');

  return prisma.$transaction(async (tx) => {
    // Deactivate current active model first
    await tx.aiModel.updateMany({
      where: { isActive: true, deletedAt: null },
      data: { isActive: false },
    });
    const activated = await tx.aiModel.update({
      where: { id },
      data: { isActive: true },
    });
    logger.info('AI model activated', { modelId: id });
    return activated;
  });
}

export async function getPrediction(routeId: string, versionId: string | undefined, time: Date) {
  const where: any = { routeId, predictionTime: time };
  if (versionId) where.versionId = versionId;

  const prediction = await prisma.trafficPrediction.findFirst({
    where,
    include: { model: { select: { version: true, accuracy: true } } },
    orderBy: { createdAt: 'desc' },
  });

  if (!prediction) throw new NotFoundError('No prediction found for the requested slot', 'PREDICTION_NOT_FOUND');
  return prediction;
}

export async function createPrediction(data: any) {
  const prediction = await prisma.trafficPrediction.create({
    data: {
      modelId: data.modelId,
      routeId: data.routeId,
      versionId: data.versionId,
      predictionTime: data.predictionTime,
      trafficLevel: data.trafficLevel,
      predictedDelayMinutes: data.predictedDelayMinutes,
      confidence: data.confidence,
    },
  });
  logger.info('Traffic prediction created', { predictionId: prediction.id });
  return prediction;
}
