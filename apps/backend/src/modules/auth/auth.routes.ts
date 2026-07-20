import { Router } from 'express';
import * as authController from './auth.controller';
import { validateBody } from '@/common/validate';
import * as authValidation from './auth.validation';
import { authenticate } from '@/common/middleware/auth.middleware';
import rateLimit from 'express-rate-limit';
import { config } from '@/config';

const router = Router();

// Rate limiters
const authLimiter = rateLimit({
    windowMs: config.rateLimit.auth.windowMs,
    max: config.rateLimit.auth.max,
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * @route POST /auth/register
 * @desc Register a new passenger
 * @access Public
 */
router.post(
    '/register',
    authLimiter,
    validateBody(authValidation.registerSchema),
    authController.register
);

/**
 * @route POST /auth/login
 * @desc Login user
 * @access Public
 */
router.post(
    '/login',
    authLimiter,
    validateBody(authValidation.loginSchema),
    authController.login
);

/**
 * @route POST /auth/refresh
 * @desc Refresh access token
 * @access Public
 */
router.post(
    '/refresh',
    validateBody(authValidation.refreshSchema),
    authController.refresh
);

/**
 * @route GET /auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get(
    '/me',
    authenticate,
    authController.getMe
);

/**
 * @route POST /auth/logout
 * @desc Logout user
 * @access Private
 */
router.post(
    '/logout',
    validateBody(authValidation.logoutSchema),
    authController.logout
);

export default router;
