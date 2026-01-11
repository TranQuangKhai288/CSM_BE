import { Request, Response, NextFunction } from 'express';
import redisService from '@core/redis/redis.service';
import { successResponse } from '@common/utils/response';
import { HTTP_STATUS } from '@common/constants';

class CacheController {
  /**
   * @swagger
   * /admin/cache/clear:
   *   delete:
   *     tags: [Cache]
   *     summary: Clear all Redis cache
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: Cache cleared successfully
   */
  async clearCache(req: Request, res: Response, next: NextFunction) {
    try {
      await redisService.clearAll();
      return successResponse(res, null, 'Cache cleared successfully', HTTP_STATUS.OK);
    } catch (error) {
      next(error);
    }
  }
}

export default new CacheController();
