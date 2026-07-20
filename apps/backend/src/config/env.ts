import dotenv from 'dotenv';
import path from 'path';
import { validateEnv, type EnvSchema } from './env.validation';

/**
 * Load environment variables from .env file
 * Priority: .env.local > .env.<NODE_ENV> > .env
 */
export function loadEnvFile(): void {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const rootDir = path.resolve(__dirname, '../..');

    // Load environment-specific file first (.env.development, .env.production, etc.)
    const envSpecificPath = path.join(rootDir, `.env.${nodeEnv}`);
    dotenv.config({ path: envSpecificPath });

    // Load local overrides (.env.local)
    const envLocalPath = path.join(rootDir, '.env.local');
    dotenv.config({ path: envLocalPath });

    // Load base .env file
    const envPath = path.join(rootDir, '.env');
    dotenv.config({ path: envPath });

    console.log(`📦 Environment loaded: ${nodeEnv}`);
}

/**
 * Parsed and validated environment configuration
 * Singleton pattern to ensure validation runs only once
 */
class Environment {
    private static instance: EnvSchema | null = null;

    static get(): EnvSchema {
        if (!Environment.instance) {
            loadEnvFile();
            Environment.instance = validateEnv(process.env);

            // Log configuration in development
            if (Environment.instance.NODE_ENV === 'development') {
                console.log('✅ Environment validation passed');
                console.log(`📍 API: http://localhost:${Environment.instance.PORT}${Environment.instance.API_PREFIX}`);
                console.log(`🔌 Database: ${Environment.instance.DATABASE_URL.split('@')[1] || 'configured'}`);
                console.log(`📮 Redis: ${Environment.instance.REDIS_ENABLED ? `${Environment.instance.REDIS_HOST}:${Environment.instance.REDIS_PORT}` : 'disabled'}`);
                console.log(`🔌 Socket.io: ${Environment.instance.SOCKET_ENABLED ? 'enabled' : 'disabled'}`);
            }
        }
        return Environment.instance;
    }

    /**
     * Force reload environment (useful for testing)
     */
    static reload(): EnvSchema {
        Environment.instance = null;
        return Environment.get();
    }

    /**
     * Check if running in specific environment
     */
    static isDevelopment(): boolean {
        return Environment.get().NODE_ENV === 'development';
    }

    static isProduction(): boolean {
        return Environment.get().NODE_ENV === 'production';
    }

    static isTest(): boolean {
        return Environment.get().NODE_ENV === 'test';
    }

    static isStaging(): boolean {
        return Environment.get().NODE_ENV === 'staging';
    }
}

export const env = Environment.get();

export { Environment };
