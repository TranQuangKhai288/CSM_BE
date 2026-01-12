import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec, swaggerUiOptions } from './config/swagger.config';
import envConfig from './config/env.config';
import { loggerMiddleware } from './middleware/logger.middleware';
import { rateLimitMiddleware } from './middleware/rate-limit.middleware';
import { errorHandler } from './common/utils/errors';
import prismaService from './core/database/prisma.service';
import redisService from './core/redis/redis.service';
import logger from './common/utils/logger';

// Import routes
import apiRoutes from './routes';

class App {
  public app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = envConfig.get('PORT');

    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // Security
    this.app.use(helmet());
    console.log(envConfig.get('CORS_ORIGIN'), 'envConfig');
    // CORS
    this.app.use(
      cors({
        origin: envConfig.get('CORS_ORIGIN').split(','),
        credentials: true,
      })
    );

    // Compression
    this.app.use(compression());

    // Cookie parser
    this.app.use(cookieParser());

    // Body parser
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Strip empty query params
    this.app.use((req, res, next) => {
      if (req.query) {
        Object.keys(req.query).forEach((key) => {
          if (req.query[key] === '') {
            delete req.query[key];
          }
        });
      }
      next();
    });

    // Logger
    this.app.use(loggerMiddleware);

    // Rate limiting
    this.app.use(rateLimitMiddleware);

    // Swagger documentation
    this.app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));
  }

  private initializeRoutes(): void {
    // Health check
    this.app.get('/health', (_req, res) => {
      res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
      });
    });

    // API routes (all routes are now managed in src/routes/)
    this.app.use('/api', apiRoutes);

    // 404 handler
    this.app.use('*', (_req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found',
      });
    });
  }

  private initializeErrorHandling(): void {
    this.app.use(errorHandler);
  }

  private async connectDatabase(): Promise<void> {
    try {
      await prismaService.onModuleInit();
      await prismaService.enableShutdownHooks();
    } catch (error) {
      logger.error('Failed to connect to database:', error);
      process.exit(1);
    }
  }

  private async connectRedis(): Promise<void> {
    // Redis service now handles its own connection errors and will fallback gracefully
    await redisService.connect();
  }

  public async listen(): Promise<void> {
    // Connect to database and redis
    await this.connectDatabase();
    await this.connectRedis();

    this.app.listen(this.port, () => {
      logger.info(`🚀 Server is running on port ${this.port}`);
      logger.info(`📚 API Docs available at http://localhost:${this.port}/api-docs`);
      logger.info(`🌍 Environment: ${envConfig.get('NODE_ENV')}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', async () => {
      logger.info('SIGTERM received, shutting down gracefully');
      await prismaService.onModuleDestroy();
      await redisService.disconnect();
      process.exit(0);
    });

    process.on('SIGINT', async () => {
      logger.info('SIGINT received, shutting down gracefully');
      await prismaService.onModuleDestroy();
      await redisService.disconnect();
      process.exit(0);
    });
  }
}

export default App;
