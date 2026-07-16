import { z } from 'zod';

/**
 * Environment Variable Validation Schemas
 * Using Zod for runtime type-safe validation
 */

const NodeEnvSchema = z.enum(['development', 'production', 'test', 'staging']);

const PortSchema = z.coerce
    .number()
    .int()
    .min(1)
    .max(65535)
    .describe('Port number must be between 1 and 65535');

const UrlSchema = z.string().url().describe('Must be a valid URL');

const DatabaseUrlSchema = z
    .string()
    .regex(
        /^postgresql:\/\/.+/,
        'Database URL must be a valid PostgreSQL connection string'
    );

const JwtSecretSchema = z
    .string()
    .min(32, 'JWT secret must be at least 32 characters for production security')
    .refine(
        (val) => {
            const weakSecrets = [
                'super_secret_jwt_key_change_in_production',
                'super_secret_refresh_key_change_in_production',
                'secret',
                'password',
                'change_me',
                '12345',
                'test',
            ];
            return !weakSecrets.includes(val.toLowerCase());
        },
        {
            message: 'JWT secret is too weak. Use a cryptographically secure random string',
        }
    );

const BooleanSchema = z
    .string()
    .transform((val) => val === 'true' || val === '1')
    .pipe(z.boolean());

/**
 * Complete Environment Variable Schema
 */
export const envSchema = z.object({
    // Application
    NODE_ENV: NodeEnvSchema.default('development'),
    PORT: PortSchema.default(4000),
    API_PREFIX: z.string().default('/api/v1'),
    APP_NAME: z.string().default('Transit Management API'),
    APP_VERSION: z.string().default('1.0.0'),

    // Database
    DATABASE_URL: DatabaseUrlSchema,
    DB_POOL_MIN: z.coerce.number().int().min(0).default(2),
    DB_POOL_MAX: z.coerce.number().int().min(1).default(10),
    DB_CONNECTION_TIMEOUT: z.coerce.number().int().min(1000).default(30000),
    DB_IDLE_TIMEOUT: z.coerce.number().int().min(1000).default(30000),

    // Redis
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: PortSchema.default(6379),
    REDIS_PASSWORD: z.string().optional(),
    REDIS_DB: z.coerce.number().int().min(0).max(15).default(0),
    REDIS_KEY_PREFIX: z.string().default('transit:'),
    REDIS_ENABLED: BooleanSchema.default(true),

    // JWT
    JWT_SECRET: JwtSecretSchema,
    JWT_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: JwtSecretSchema,
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    JWT_ISSUER: z.string().default('transit-management'),
    JWT_AUDIENCE: z.string().default('transit-api'),

    // Security
    BCRYPT_ROUNDS: z.coerce.number().int().min(10).max(15).default(12),
    MAX_LOGIN_ATTEMPTS: z.coerce.number().int().min(3).max(10).default(5),
    ACCOUNT_LOCKOUT_DURATION: z.coerce.number().int().min(60000).default(1800000), // 30 minutes
    SESSION_SECRET: z.string().min(32).optional(),

    // CORS
    CORS_ORIGIN: z.string().default('*'),
    CORS_CREDENTIALS: BooleanSchema.default(true),
    CORS_MAX_AGE: z.coerce.number().int().min(0).default(86400),

    // Rate Limiting
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(900000), // 15 minutes
    RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).default(100),
    RATE_LIMIT_AUTH_WINDOW_MS: z.coerce.number().int().min(1000).default(900000),
    RATE_LIMIT_AUTH_MAX_REQUESTS: z.coerce.number().int().min(1).default(5),

    // Socket.io
    SOCKET_ENABLED: BooleanSchema.default(false),
    SOCKET_PATH: z.string().default('/socket.io'),
    SOCKET_CORS_ORIGIN: z.string().default('*'),
    SOCKET_PING_TIMEOUT: z.coerce.number().int().min(1000).default(60000),
    SOCKET_PING_INTERVAL: z.coerce.number().int().min(1000).default(25000),
    SOCKET_MAX_CONNECTIONS: z.coerce.number().int().min(1).default(1000),

    // Logging
    LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly']).default('info'),
    LOG_FORMAT: z.enum(['json', 'simple', 'combined']).default('json'),
    LOG_FILE_ENABLED: BooleanSchema.default(false),
    LOG_FILE_PATH: z.string().default('./logs'),

    // Monitoring
    ENABLE_REQUEST_LOGGING: BooleanSchema.default(true),
    ENABLE_PERFORMANCE_MONITORING: BooleanSchema.default(true),
    SLOW_REQUEST_THRESHOLD_MS: z.coerce.number().int().min(100).default(1000),

    // Pagination
    DEFAULT_PAGE_SIZE: z.coerce.number().int().min(1).max(100).default(20),
    MAX_PAGE_SIZE: z.coerce.number().int().min(1).max(1000).default(100),

    // File Upload (if needed)
    MAX_FILE_SIZE_MB: z.coerce.number().int().min(1).max(100).default(10),
    UPLOAD_DIR: z.string().default('./uploads'),

    // External Services (placeholder for future integrations)
    SMS_PROVIDER: z.enum(['twilio', 'aws-sns', 'mock']).default('mock').optional(),
    SMS_API_KEY: z.string().optional(),
    EMAIL_PROVIDER: z.enum(['sendgrid', 'aws-ses', 'smtp', 'mock']).default('mock').optional(),
    EMAIL_API_KEY: z.string().optional(),

    // Feature Flags
    ENABLE_SWAGGER: BooleanSchema.default(false),
    ENABLE_GRAPHQL: BooleanSchema.default(false),
    ENABLE_METRICS: BooleanSchema.default(false),
    ENABLE_HEALTH_CHECK: BooleanSchema.default(true),

    // AI/ML Service (for predictions module)
    AI_SERVICE_URL: UrlSchema.optional(),
    AI_SERVICE_API_KEY: z.string().optional(),
    AI_SERVICE_TIMEOUT_MS: z.coerce.number().int().min(1000).default(30000),
});

export type EnvSchema = z.infer<typeof envSchema>;

/**
 * Validate environment variables with detailed error reporting
 */
export function validateEnv(env: NodeJS.ProcessEnv): EnvSchema {
    try {
        const parsed = envSchema.parse(env);

        // Additional custom validation for production
        if (parsed.NODE_ENV === 'production') {
            if (parsed.CORS_ORIGIN === '*') {
                console.warn(
                    '⚠️  WARNING: CORS is set to allow all origins in production. ' +
                    'This is insecure! Set CORS_ORIGIN to specific domains.'
                );
            }

            if (!parsed.SESSION_SECRET) {
                console.warn('⚠️  WARNING: SESSION_SECRET not set in production');
            }
        }

        return parsed;
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors
                .map((err) => `  ❌ ${err.path.join('.')}: ${err.message}`)
                .join('\n');

            throw new Error(
                `\n❌ Environment Variable Validation Failed:\n${errorMessages}\n\n` +
                `Please check your .env file and ensure all required variables are set correctly.\n`
            );
        }
        throw error;
    }
}

/**
 * Get a type-safe environment variable
 */
export function getEnvVar<K extends keyof EnvSchema>(
    key: K,
    env: EnvSchema
): EnvSchema[K] {
    return env[key];
}
