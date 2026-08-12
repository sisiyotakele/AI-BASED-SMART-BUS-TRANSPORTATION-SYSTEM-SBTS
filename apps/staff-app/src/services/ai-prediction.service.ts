import api from '../lib/api';

export interface AIModel {
    id: string;
    version: string;
    accuracy: number;
    trainedAt: string;
    modelParameters: any;
    datasetSize: number;
    isActive: boolean;
    createdAt: string;
}

export interface PredictionResult {
    id: string;
    predictionTime: string;
    trafficLevel: 'low' | 'moderate' | 'high' | 'severe';
    predictedDelayMinutes: number;
    confidence: number;
    createdAt: string;
    route?: {
        routeName: string;
    };
}

class AIPredictionService {
    async getModels(): Promise<AIModel[]> {
        const response = await api.get('/ai-prediction/models');
        return response.data.data;
    }

    async getActiveModel(): Promise<AIModel | null> {
        try {
            const response = await api.get('/ai-prediction/models/active');
            return response.data.data;
        } catch (error: any) {
            if (error.response?.status === 404) {
                return null;
            }
            throw error;
        }
    }

    async activateModel(id: string): Promise<AIModel> {
        const response = await api.patch(`/ai-prediction/models/${id}/activate`);
        return response.data;
    }

    async createModel(data: {
        version: string;
        accuracy: number;
        trainedAt: string;
        datasetSize: number;
        modelParameters?: any;
    }): Promise<AIModel> {
        const response = await api.post('/ai-prediction/models', data);
        return response.data;
    }

    async getPredictions(params: { routeId: string; versionId?: string }): Promise<PredictionResult[]> {
        const response = await api.get('/ai-prediction/predictions', { params });
        return response.data.data;
    }

    async createPrediction(data: {
        modelId: string;
        routeId: string;
        versionId: string;
        predictionTime: string;
        trafficLevel: 'low' | 'moderate' | 'high' | 'severe';
        predictedDelayMinutes: number;
        confidence: number;
    }): Promise<PredictionResult> {
        const response = await api.post('/ai-prediction/predictions', data);
        return response.data;
    }
}

export const aiPredictionService = new AIPredictionService();
