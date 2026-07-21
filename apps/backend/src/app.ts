import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';

import { config } from '@/config';
import { errorResponse } from '@/common/response';
import { errorHandler } from '@/common/middleware/error.middleware';
import { requestIdMiddleware } from '@/common/middleware/request-id.middleware';
import { responseTimeMiddleware } from '@/common/middleware/response-time.middleware';
import { getSimpleHealth } from '@/common/health';

// Import modules
import { authRoutes } from '@/modules/auth';
import { rbacRoutes } from '@/modules/rbac';
import { terminalRoutes } from '@/modules/terminals';
import { busRoutes } from '@/modules/buses';
import { driverRoutes } from '@/modules/drivers';

const app = express();

// Middleware
app.set('trust proxy', 1);
app.use(requestIdMiddleware);
app.use(responseTimeMiddleware);
app.use(helmet());
app.use(compression());
app.use(cors({ origin: config.cors.origin, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Root welcome route
app.get('/', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to SBTS (Smart Bus Transportation System) API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      api: config.apiPrefix,
      auth: `${config.apiPrefix}/auth`,
      rbac: `${config.apiPrefix}/rbac`,
      terminals: `${config.apiPrefix}/terminals`,
      buses: `${config.apiPrefix}/buses`,
      drivers: `${config.apiPrefix}/drivers`,
    },
    documentation: `${config.apiPrefix}/docs`,
  });
});

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json(getSimpleHealth());
});

// API routes
const apiPrefix = config.apiPrefix;

// Authentication
app.use(`${apiPrefix}/auth`, authRoutes);

// RBAC
app.use(`${apiPrefix}/rbac`, rbacRoutes);

// Terminals
app.use(`${apiPrefix}/terminals`, terminalRoutes);

// Buses
app.use(`${apiPrefix}/buses`, busRoutes);

// Drivers
app.use(`${apiPrefix}/drivers`, driverRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json(errorResponse('Endpoint not found', 'NOT_FOUND'));
});

// Error handler
app.use(errorHandler);

export default app;