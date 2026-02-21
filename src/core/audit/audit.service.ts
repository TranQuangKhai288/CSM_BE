import prismaService from '@core/database/prisma.service';
import logger from '@common/utils/logger';

interface CreateActivityLogDto {
  userId?: string;
  action: string; // CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
  entity: string; // User, Product, Order, etc.
  entityId?: string;
  changes?: any; // Record old and new values
  ipAddress?: string;
  userAgent?: string;
}

class AuditService {
  /**
   * Log an activity/audit entry
   */
  async log(data: CreateActivityLogDto): Promise<void> {
    try {
      await prismaService.activityLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          changes: data.changes || {},
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      // Don't throw error - audit logging should not break application flow
      logger.error('Failed to create activity log:', error);
    }
  }

  /**
   * Get activity logs with filtering
   */
  async getActivityLogs(query: {
    page?: number;
    pageSize?: number;
    userId?: string;
    entity?: string;
    entityId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 50, 100);
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (query.userId) {
      where.userId = query.userId;
    }

    if (query.entity) {
      where.entity = query.entity;
    }

    if (query.entityId) {
      where.entityId = query.entityId;
    }

    if (query.action) {
      where.action = query.action;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = query.startDate;
      }
      if (query.endDate) {
        where.createdAt.lte = query.endDate;
      }
    }

    const [logs, total] = await Promise.all([
      prismaService.activityLog.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prismaService.activityLog.count({ where }),
    ]);

    return {
      data: logs,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get recent activity for a specific user
   */
  async getUserActivity(userId: string, limit: number = 20) {
    return prismaService.activityLog.findMany({
      where: { userId },
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get recent activity for a specific entity
   */
  async getEntityActivity(entity: string, entityId: string, limit: number = 20) {
    return prismaService.activityLog.findMany({
      where: {
        entity,
        entityId,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Helper: Log product change
   */
  async logProductChange(
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    productId: string,
    userId?: string,
    changes?: any,
    req?: any
  ) {
    await this.log({
      userId,
      action,
      entity: 'Product',
      entityId: productId,
      changes,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get?.('user-agent'),
    });
  }

  /**
   * Helper: Log order change
   */
  async logOrderChange(
    action: 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE',
    orderId: string,
    userId?: string,
    changes?: any,
    req?: any
  ) {
    await this.log({
      userId,
      action,
      entity: 'Order',
      entityId: orderId,
      changes,
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get?.('user-agent'),
    });
  }

  /**
   * Helper: Log user authentication
   */
  async logAuth(
    action: 'LOGIN' | 'LOGOUT' | 'REGISTER' | 'PASSWORD_CHANGE',
    userId?: string,
    req?: any
  ) {
    await this.log({
      userId,
      action,
      entity: 'Auth',
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      userAgent: req?.get?.('user-agent'),
    });
  }

  /**
   * Clean up old logs (for GDPR compliance / data retention)
   */
  async cleanupOldLogs(daysToKeep: number = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const result = await prismaService.activityLog.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
      },
    });

    logger.info(`Deleted ${result.count} old activity logs (older than ${daysToKeep} days)`);
    return result.count;
  }
}

const auditService = new AuditService();
export default auditService;
