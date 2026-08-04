import { logger } from '@/common/logger';
import { config } from '@/config';

export interface TrafficPredictionInput {
  origin_lat: number;
  origin_lon: number;
  dest_lat: number;
  dest_lon: number;
  route_id?: string;
  direction?: string;
  timestamp?: string;
}

export interface ETAPredictionInput extends TrafficPredictionInput {
  mileage?: number;
}

export interface CombinedPredictionInput extends ETAPredictionInput { }

export interface BatchPredictionInput {
  trips: Array<CombinedPredictionInput>;
}

class AIService {
  private baseUrl: string;
  private timeout: number;

  constructor() {
    this.baseUrl = config.aiServiceUrl;
    this.timeout = 30000; // 30 seconds
  }

  async healthCheck(): Promise<{ status: string; version?: string }> {
    try {
      const response = await this.makeRequest('/health', 'GET');
      return response;
    } catch (error) {
      logger.error('AI Service health check failed', { error });
      throw new Error('AI Service is unavailable');
    }
  }

  async predictTraffic(input: TrafficPredictionInput): Promise<any> {
    return this.makeRequest('/predict/traffic', 'POST', input);
  }

  async predictETA(input: ETAPredictionInput): Promise<any> {
    return this.makeRequest('/predict/eta', 'POST', input);
  }

  async predictCombined(input: CombinedPredictionInput): Promise<any> {
    return this.makeRequest('/predict/combined', 'POST', input);
  }

  async predictBatch(trips: Array<CombinedPredictionInput>): Promise<any> {
    return this.makeRequest('/predict/batch', 'POST', { trips });
  }

  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' = 'GET',
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(this.timeout),
      };

      if (body && method === 'POST') {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData: any = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || `AI Service returned ${response.status}`);
      }

      return await response.json();
    } catch (error: any) {
      logger.error('AI Service request failed', { url, method, error: error.message });

      if (error.name === 'AbortError') {
        throw new Error('AI Service request timed out');
      }

      throw error;
    }
  }
}

export const aiService = new AIService();
