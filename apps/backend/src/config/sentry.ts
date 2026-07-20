import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import { env } from './env';
import { logger } from '@/common/logger';

/**
 * Initialize Sentry error monitoring
 * Call this once at application startup in server.ts
 */
export function initializeSentry() {
    if (!env.SENTRY_DSN) {
        logger.warn('Sentry DSN not configured - error monitoring disabled');
        return;
    }

    Sentry.init({
        dsn: env.SENTRY_DSN,
        environment: env.NODE_ENV,

        // Performance Monitoring
        tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% in prod, 100% in dev

        // Profiling
        profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
        integrations: [
            new ProfilingIntegration(),
        ],

        // Release tracking
        release: process.env.npm_package_version || '1.0.0',

        // Don't send errors in test environment
        enabled: env.NODE_ENV !== 'test',

        // Filter out sensitive data
        beforeSend(event, hint) {
            // Remove sensitive headers
            if (event.request?.headers) {
                delete event.request.headers['authorization'];
                delete event.request.headers['cookie'];
            }

            // Remove sensitive data from extra
            if (event.extra) {
                delete event.extra.password;
                delete event.extra.passwordHash;
                delete event.extra.token;
            }

            return event;
        },

        // Ignore common errors
        ignoreErrors: [
            'ECONNRESET',
            'ECONNREFUSED',
            'ETIMEDOUT',
            'socket hang up',
        ],
    });

    logger.info('✅ Sentry error monitoring initialized', {
        environment: env.NODE_ENV,
        dsn: env.SENTRY_DSN.substring(0, 20) + '...',
    });
}

/**
 * Express error handler middleware for Sentry
 * Use this BEFORE your custom error handler
 */
export const sentryErrorHandler = Sentry.Handlers.errorHandler();

/**
 * Express request handler middleware for Sentry
 * Use this EARLY in your middleware chain (after body parsing)
 */
export const sentryRequestHandler = Sentry.Handlers.requestHandler({
    user: ['id', 'email'], // Include user context
});

/**
 * Express tracing middleware for Sentry
 * Use this with request handler for performance monitoring
 */
export const sentryTracingHandler = Sentry.Handlers.tracingHandler();

/**
 * Manually capture an exception
 */
export function captureException(error: Error, context?: Record<string, any>) {
    Sentry.captureException(error, {
        extra: context,
    });
}

/**
 * Manually capture a message
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    Sentry.captureMessage(message, level);
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: { id: string; email?: string; role?: string }) {
    Sentry.setUser({
        id: user.id,
        email: user.email,
        role: user.role,
    });
}

/**
 * Clear user context (e.g., on logout)
 */
export function clearUserContext() {
    Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category?: string, level?: 'info' | 'warning' | 'error') {
    Sentry.addBreadcrumb({
        message,
        category: category || 'custom',
        level: level || 'info',
        timestamp: Date.now() / 1000,
    });
}

/**
 * Close Sentry connection gracefully on shutdown
 */
export async function closeSentry() {
    await Sentry.close(2000); // Wait 2 seconds for pending events
    logger.info('✅ Sentry connection closed');
}
