import { Router } from 'express';
import * as authController from './auth.controller';
import { validateBody } from '@/common/validate';
import * as authValidation from './auth.validation';
import { authenticate } from '@/common/middleware/auth.middleware';
import rateLimit from 'express-rate-limit';
import { config } from '@/config';

const router = Router();

// ============================================================
// RATE LIMITERS
// ============================================================

/**
 * Auth rate limiter — 5 attempts per 15 minutes (supervisor requirement).
 * Disabled in development to avoid lockouts during testing.
 */
const authLimiter = rateLimit({
    windowMs: config.rateLimit.auth.windowMs,          // 15 minutes
    max: config.env === 'development' ? 1000 : 5,       // 5 in production
    message: {
        success: false,
        message: 'Too many login attempts. Please try again in 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: config.env === 'development',
});

/**
 * Forgot-password rate limiter — 5 attempts per 15 minutes (supervisor requirement).
 * Same limit as login to prevent password-reset abuse.
 */
const forgotPasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,                          // 15 minutes
    max: config.env === 'development' ? 1000 : 5,       // 5 in production
    message: {
        success: false,
        message: 'Too many password reset requests. Please try again in 15 minutes.',
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
});

// ============================================================
// ROUTES
// ============================================================

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new passenger
 *     tags: [Authentication]
 */
router.post(
    '/register',
    authLimiter,
    validateBody(authValidation.registerSchema),
    authController.register
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     description: Returns mustChangePassword flag — if true, redirect user to /change-password.
 *     tags: [Authentication]
 */
router.post(
    '/login',
    authLimiter,
    validateBody(authValidation.loginSchema),
    authController.login
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 */
router.post(
    '/refresh',
    validateBody(authValidation.refreshSchema),
    authController.refresh
);

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 */
router.get(
    '/me',
    authenticate,
    authController.getMe
);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 */
router.post(
    '/logout',
    validateBody(authValidation.logoutSchema),
    authController.logout
);

/**
 * @swagger
 * /api/v1/auth/change-password:
 *   post:
 *     summary: Change password (authenticated)
 *     description: >
 *       Used in two cases:
 *       1. Admin-assigned password forced change (mustChangePassword = true)
 *       2. Voluntary password change by logged-in user
 *       On success, mustChangePassword is reset to false.
 *     tags: [Authentication]
 */
router.post(
    '/change-password',
    authenticate,
    validateBody(authValidation.changePasswordSchema),
    authController.changePassword
);

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request a password reset token (rate limited to 5/15min)
 *     tags: [Authentication]
 */
router.post(
    '/forgot-password',
    forgotPasswordLimiter,
    validateBody(authValidation.forgotPasswordSchema),
    authController.forgotPassword
);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password using token from forgot-password
 *     tags: [Authentication]
 */
router.post(
    '/reset-password',
    forgotPasswordLimiter,
    validateBody(authValidation.resetPasswordSchema),
    authController.resetPassword
);

export default router;
