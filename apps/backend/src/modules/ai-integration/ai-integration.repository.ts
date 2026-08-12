import { logger } from '@/common/logger';
import { aiService } from '@/services/ai-service';
import type {
    TrafficPredictionInput,
    ETAPredictionInput,
    CombinedPredictionInput,
} from '@/services/ai-service';

// Repository layer for AI Integration
// This layer handles all external AI service calls

export async function checkHealth() {
    return aiService.healthCheck();
}

export async function requestTrafficPrediction(input: TrafficPredictionInput) {
    return aiService.predictTraffic(input);
}

export async function requestETAPrediction(input: ETAPredictionInput) {
    return aiService.predictETA(input);
}

export async function requestCombinedPrediction(input: CombinedPredictionInput) {
    return aiService.predictCombined(input);
}

export async function requestBatchPrediction(trips: Array<CombinedPredictionInput>) {
    return aiService.predictBatch(trips);
}
