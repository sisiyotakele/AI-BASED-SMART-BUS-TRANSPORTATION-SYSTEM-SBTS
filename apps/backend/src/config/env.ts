export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  backendPort: Number(process.env.BACKEND_PORT ?? 4000),
  aiServiceUrl: process.env.AI_SERVICE_URL ?? 'http://localhost:8000',
};