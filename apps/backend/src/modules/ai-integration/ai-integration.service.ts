import { logger } from '@/common/logger';
import * as repository from './ai-integration.repository';
import type {
    TrafficPredictionInput,
    ETAPredictionInput,
    CombinedPredictionInput,
} from '@/services/ai-service';

// Service layer for AI Integration
// Handles business logic, validation, and logging

export async function checkAIServiceHealth() {
    try {
        const health = await repository.checkHealth();
        logger.info('AI Service health check successful', { status: health.status });
        return health;
    } catch (error) {
        logger.error('AI Service health check failed', { error });
        throw error;
    }
}

export async function predictTraffic(input: TrafficPredictionInput) {
    try {
        // Business logic: validate inputs if needed
        if (!input.origin_lat || !input.origin_lon || !input.dest_lat || !input.dest_lon) {
            throw new Error('Missing required coordinate fields');
        }

        const prediction = await repository.requestTrafficPrediction(input);

        logger.info('Traffic prediction successful', {
            routeId: input.route_id,
            direction: input.direction
        });

        return prediction;
    } catch (error) {
        logger.error('Traffic prediction failed', { error, input });
        throw error;
    }
}

export async function predictETA(input: ETAPredictionInput) {
    try {
        // Business logic: validate inputs if needed
        if (!input.origin_lat || !input.origin_lon || !input.dest_lat || !input.dest_lon) {
            throw new Error('Missing required coordinate fields');
        }

        const prediction = await repository.requestETAPrediction(input);

        logger.info('ETA prediction successful', {
            routeId: input.route_id,
            mileage: input.mileage
        });

        return prediction;
    } catch (error) {
        logger.error('ETA prediction failed', { error, input });
        throw error;
    }
}

export async function predictCombined(input: CombinedPredictionInput) {
    try {
        // Business logic: validate inputs if needed
        if (!input.origin_lat || !input.origin_lon || !input.dest_lat || !input.dest_lon) {
            throw new Error('Missing required coordinate fields');
        }

        const prediction = await repository.requestCombinedPrediction(input);

        logger.info('Combined prediction successful', {
            routeId: input.route_id,
            hasTraffic: !!prediction.traffic,
            hasETA: !!prediction.eta
        });

        return prediction;
    } catch (error) {
        logger.error('Combined prediction failed', { error, input });
        throw error;
    }
}

export async function predictBatch(trips: Array<CombinedPredictionInput>) {
    try {
        // Business logic: validate batch size
        if (!Array.isArray(trips) || trips.length === 0) {
            throw new Error('Trips must be a non-empty array');
        }

        if (trips.length > 100) {
            throw new Error('Batch size cannot exceed 100 trips');
        }

        // Validate each trip has required fields
        for (const trip of trips) {
            if (!trip.origin_lat || !trip.origin_lon || !trip.dest_lat || !trip.dest_lon) {
                throw new Error('All trips must have valid coordinates');
            }
        }

        const prediction = await repository.requestBatchPrediction(trips);

        logger.info('Batch prediction successful', {
            tripCount: trips.length,
            resultsCount: prediction.results?.length
        });

        return prediction;
    } catch (error) {
        logger.error('Batch prediction failed', { error, tripCount: trips.length });
        throw error;
    }
}
