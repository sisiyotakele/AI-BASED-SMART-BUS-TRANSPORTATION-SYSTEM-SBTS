/**
 * Configuration Module - Main Export
 * 
 * Centralized configuration system with:
 * - Type-safe environment variables (Zod validation)
 * - Structured config modules (database, redis, jwt, cors, socket)
 * - Development and production optimizations
 * - Comprehensive validation and error handling
 * 
 * @module config
 */

// Core environment management
export { env, Environment, loadEnvFile } from './env';
export { envSchema, validateEnv, getEnvVar, type EnvSchema } from './env.validation';

// Database configuration
export { databaseConfig, prismaClientOptions, checkDatabaseConnection, disconnectDatabase } from './database';

// Redis configuration
export { redisConfig, RedisClient, redisUtils } from './redis';

// JWT configuration
export { jwtConfig, jwtUtils, type JwtPayload } from './jwt';

// CORS configuration
export { corsConfig, corsUtils } from './cors';

// Socket.io configuration
export { socketConfig, SocketServer } from './socket';

// Rate limiting configuration
export {
  createGeneralLimiter,
  createAuthLimiter,
  createStrictLimiter,
  createCustomLimiter
} from './rate-limit';

/**
 * Legacy config export for backward compatibility
 * @deprecated Use named imports instead (env, jwtConfig, etc.)
 */
import { env } from './env';

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  apiPrefix: env.API_PREFIX,

  database: {
    url: env.DATABASE_URL,
  },

  jwt: {
    secret: env.JWT_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshSecret: env.JWT_REFRESH_SECRET,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },

  bcrypt: {
    rounds: env.BCRYPT_ROUNDS,
  },

  cors: {
    origin: env.CORS_ORIGIN.split(',').map(s => s.trim()),
  },

  rateLimit: {
    auth: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 requests per windowMs
    },
    general: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // 100 requests per windowMs
    },
    strict: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 10, // 10 requests per windowMs
    },
  },

  security: {
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
  },
} as const;

export type Config = typeof config;
