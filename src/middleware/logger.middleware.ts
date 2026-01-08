import { Request, Response, NextFunction } from 'express';
import logger from '@common/utils/logger';

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  // Log request
  logger.http(`${req.method} ${req.path} - ${req.ip}`);

  // Log response on finish
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.path} ${res.statusCode} - ${duration}ms`;

    if (res.statusCode >= 500) {
      logger.error(message);
    } else if (res.statusCode >= 400) {
      logger.warn(message);
    } else {
      logger.info(message);
    }
  });

  next();
};
