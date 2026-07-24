import app from './app';
import { config } from './config';
import { logger } from './common/logger';
import { prisma } from './prisma/client';
import { initializeSocketIO } from './config/socket';
import { initializeTrackingSocket } from './modules/tracking/tracking.socket';
import { createServer } from 'http';

const PORT = config.port;

async function bootstrap() {
  try {
    // Verify database connection
    await prisma.$connect();
    logger.info('✅ Database connection established');

    // Create HTTP server and initialize Socket.IO
    const httpServer = createServer(app);
    const io = initializeSocketIO(httpServer);

    // Initialize tracking-specific socket handlers
    if (io) {
      initializeTrackingSocket(io);
      logger.info('✅ Tracking Socket.IO handlers initialized');
    }

    logger.info('✅ Socket.IO initialized');

    // Make io available globally for services to emit events
    (global as any).io = io;

    httpServer.listen(PORT, () => {
      logger.info(`🚀 SBTS Backend running on port ${PORT}`);
      logger.info(`📡 Environment: ${config.env}`);
      logger.info(`🔌 API Base: ${config.apiPrefix}`);
      logger.info(`🔴 Socket.IO ready for real-time events`);
      logger.info(`📍 GPS Tracking enabled`);
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

bootstrap();

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});
