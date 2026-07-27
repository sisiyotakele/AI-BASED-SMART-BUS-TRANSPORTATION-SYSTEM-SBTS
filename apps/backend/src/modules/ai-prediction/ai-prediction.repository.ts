import { prisma } from '@/prisma/client';

// ============================================================
// AI MODEL QUERIES
// ============================================================

export async function createModel(data: any) {
    return prisma.aiModel.create({ data });
}

export async function findModels() {
    return prisma.aiModel.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' }
    });
}

export async function findActiveModel() {
    return prisma.aiModel.findFirst({
        where: { isActive: true, deletedAt: null }
    });
}

export async function findModelById(id: string) {
    return prisma.aiModel.findFirst({
        where: { id, deletedAt: null }
    });
}

export async function deactivateAllModels(tx: any) {
    return tx.aiModel.updateMany({
        where: { isActive: true, deletedAt: null },
        data: { isActive: false },
    });
}

export async function updateModel(tx: any, id: string, data: any) {
    return tx.aiModel.update({
        where: { id },
        data,
    });
}

// ============================================================
// TRAFFIC PREDICTION QUERIES
// ============================================================

export async function findLatestPrediction(where: any) {
    return prisma.trafficPrediction.findFirst({
        where,
        include: {
            model: {
                select: { version: true, accuracy: true }
            }
        },
        orderBy: { createdAt: 'desc' },
    });
}

export async function createPrediction(data: any) {
    return prisma.trafficPrediction.create({ data });
}

// ============================================================
// TRANSACTION HELPER
// ============================================================

export async function executeTransaction(callback: (tx: any) => Promise<any>) {
    return prisma.$transaction(callback);
}
