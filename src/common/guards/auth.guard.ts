import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '@common/utils/errors';
import envConfig from '@config/env.config';
import redisService from '@core/redis/redis.service';

export interface JwtPayload {
  userId: string;
  email: string;
  roleId: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authGuard = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    // Check if token is blacklisted (logged out)
    const isBlacklisted = await redisService.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      throw new UnauthorizedError('Token has been revoked');
    }

    // Verify token
    const decoded = jwt.verify(token, envConfig.get('JWT_SECRET')) as JwtPayload;

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(error);
    }
  }
};
