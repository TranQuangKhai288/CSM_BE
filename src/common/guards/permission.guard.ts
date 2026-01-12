import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.guard';
import { ForbiddenError } from '@common/utils/errors';
import redisService from '@core/redis/redis.service';
import { CACHE_KEYS, CACHE_TTL } from '@common/constants';
import prismaService from '@core/database/prisma.service';

export const permissionGuard = (requiredPermissions: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ForbiddenError('User not authenticated');
      }

      const userId = req.user.userId;
      // Check cache first
      let userPermissions = await redisService.getJSON<string[]>(
        CACHE_KEYS.USER_PERMISSIONS(userId)
      );

      if (!userPermissions) {
        // Fetch from database
        const user = await prismaService.user.findUnique({
          where: { id: userId },
          include: {
            role: {
              select: {
                permissions: true,
              },
            },
          },
        });

        if (!user) {
          throw new ForbiddenError('User not found');
        }

        userPermissions = user.role.permissions as string[];
        console.log('userPermissions: ', userPermissions);

        // Cache permissions
        await redisService.setJSON(
          CACHE_KEYS.USER_PERMISSIONS(userId),
          userPermissions,
          CACHE_TTL.MEDIUM
        );
      }

      // Check if user has admin permission (*)
      if (userPermissions.includes('*')) {
        return next();
      }
      // Check if user has required permissions
      const hasPermission = requiredPermissions.every((permission) => {
        // Check exact permission or wildcard (e.g., products.* matches products.read)
        return userPermissions.some((userPerm) => {
          if (userPerm === permission) return true;
          if (userPerm.endsWith('.*')) {
            const prefix = userPerm.slice(0, -2);
            return permission.startsWith(prefix);
          }
          return false;
        });
      });

      if (!hasPermission) {
        throw new ForbiddenError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
