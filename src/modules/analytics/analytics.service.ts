import prismaService from '@core/database/prisma.service';
import redisService from '@core/redis/redis.service';
import {
  CreateAnalyticsDto,
  UpdateAnalyticsDto,
  AnalyticsQuery,
  SalesAnalyticsQuery,
  ProductAnalyticsQuery,
  CustomerAnalyticsQuery,
  PageViewDto,
  DashboardStatsQuery,
} from './dto/analytics.dto';
import { NotFoundError } from '@common/utils/errors';
import { CACHE_KEYS, CACHE_TTL } from '@common/constants';
import { RESPONSE_CODES } from '@common/constants/response-codes';

class AnalyticsService {
  // Create analytics record
  async createAnalytics(data: CreateAnalyticsDto) {
    const analytics = await prismaService.analytics.create({
      data,
    });

    return analytics;
  }

  // Get analytics with filtering
  async getAnalytics(query: AnalyticsQuery) {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 20, 100);
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (query.type) {
      where.type = query.type;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.metric) {
      where.metric = query.metric;
    }

    if (query.startDate || query.endDate) {
      where.date = {};
      if (query.startDate) {
        where.date.gte = query.startDate;
      }
      if (query.endDate) {
        where.date.lte = query.endDate;
      }
    }

    const [analytics, total] = await Promise.all([
      prismaService.analytics.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { date: 'desc' },
      }),
      prismaService.analytics.count({ where }),
    ]);

    return {
      data: analytics,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // Get analytics by ID
  async getAnalyticsById(id: string) {
    const analytics = await prismaService.analytics.findUnique({
      where: { id },
    });

    if (!analytics) {
      throw new NotFoundError('Analytics not found', RESPONSE_CODES.NOT_FOUND);
    }

    return analytics;
  }

  // Update analytics
  async updateAnalytics(id: string, data: UpdateAnalyticsDto) {
    await this.getAnalyticsById(id);

    const updated = await prismaService.analytics.update({
      where: { id },
      data,
    });

    return updated;
  }

  // Delete analytics
  async deleteAnalytics(id: string) {
    await this.getAnalyticsById(id);

    await prismaService.analytics.delete({
      where: { id },
    });

    return { message: 'Analytics deleted successfully' };
  }

  // ==================== Sales Analytics ====================

  async getSalesAnalytics(query: SalesAnalyticsQuery) {
    const where: any = {};

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = query.startDate;
      }
      if (query.endDate) {
        where.createdAt.lte = query.endDate;
      }
    }

    const [totalRevenue, totalOrders, averageOrderValue, ordersByStatus] = await Promise.all([
      prismaService.order.aggregate({
        where: { ...where, status: 'DELIVERED' },
        _sum: { total: true },
      }),
      prismaService.order.count({ where }),
      prismaService.order.aggregate({
        where: { ...where, status: 'DELIVERED' },
        _avg: { total: true },
      }),
      prismaService.order.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
        _sum: { total: true },
      }),
    ]);

    return {
      totalRevenue: totalRevenue._sum.total || 0,
      totalOrders,
      averageOrderValue: averageOrderValue._avg.total || 0,
      ordersByStatus: ordersByStatus.map((item) => ({
        status: item.status,
        count: item._count.id,
        total: item._sum.total || 0,
      })),
    };
  }

  // Get sales over time
  async getSalesOverTime(query: SalesAnalyticsQuery) {
    const groupBy = query.groupBy || 'day';
    const where: any = {};

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = query.startDate;
      }
      if (query.endDate) {
        where.createdAt.lte = query.endDate;
      }
    }

    // Get all orders in the date range
    const orders = await prismaService.order.findMany({
      where: { ...where, status: 'DELIVERED' },
      select: {
        createdAt: true,
        total: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by specified time period
    const grouped = orders.reduce((acc: any, order) => {
      let key: string;
      const date = new Date(order.createdAt);

      switch (groupBy) {
        case 'year':
          key = date.getFullYear().toString();
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'week':
          const weekNumber = this.getWeekNumber(date);
          key = `${date.getFullYear()}-W${String(weekNumber).padStart(2, '0')}`;
          break;
        case 'day':
        default:
          key = date.toISOString().split('T')[0];
          break;
      }

      if (!acc[key]) {
        acc[key] = { date: key, revenue: 0, orders: 0 };
      }

      acc[key].revenue += Number(order.total);
      acc[key].orders += 1;

      return acc;
    }, {});

    return Object.values(grouped);
  }

  // Helper function to get week number
  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  // ==================== Product Analytics ====================

  async getProductAnalytics(query: ProductAnalyticsQuery) {
    const where: any = {};

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = query.startDate;
      }
      if (query.endDate) {
        where.createdAt.lte = query.endDate;
      }
    }

    // Top selling products
    const topProducts = await prismaService.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: where,
      },
      _sum: {
        quantity: true,
        total: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          total: 'desc',
        },
      },
      take: query.limit || 10,
    });

    // Get product details
    const productIds = topProducts.map((item) => item.productId);
    const products = await prismaService.product.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        sku: true,
        basePrice: true,
      },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));

    return topProducts.map((item) => ({
      product: productMap.get(item.productId),
      totalQuantity: item._sum.quantity || 0,
      totalRevenue: item._sum.total || 0,
      orderCount: item._count.id,
    }));
  }

  // Get low stock products
  async getLowStockProducts(threshold?: number) {
    const lowStockThreshold = threshold || 10;

    const products = await prismaService.product.findMany({
      where: {
        stock: {
          lte: lowStockThreshold,
        },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stock: true,
        lowStock: true,
        category: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        stock: 'asc',
      },
    });

    return products;
  }

  // ==================== Customer Analytics ====================

  async getCustomerAnalytics(query: CustomerAnalyticsQuery) {
    const where: any = {};

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = query.startDate;
      }
      if (query.endDate) {
        where.createdAt.lte = query.endDate;
      }
    }

    const [totalCustomers, newCustomers, customerStats, topCustomers] = await Promise.all([
      prismaService.customer.count(),
      prismaService.customer.count({ where }),
      prismaService.customer.aggregate({
        _sum: {
          totalSpent: true,
          totalOrders: true,
        },
        _avg: {
          totalSpent: true,
          totalOrders: true,
        },
      }),
      prismaService.customer.findMany({
        orderBy: {
          totalSpent: 'desc',
        },
        take: 10,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          totalOrders: true,
          totalSpent: true,
        },
      }),
    ]);

    return {
      totalCustomers,
      newCustomers,
      totalRevenue: customerStats._sum.totalSpent || 0,
      totalOrders: customerStats._sum.totalOrders || 0,
      averageSpent: customerStats._avg.totalSpent || 0,
      averageOrders: customerStats._avg.totalOrders || 0,
      topCustomers,
    };
  }

  // ==================== Page Views ====================

  async trackPageView(data: PageViewDto) {
    const pageView = await prismaService.pageView.create({
      data,
    });

    return pageView;
  }

  async getPageViews(query: AnalyticsQuery) {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 20, 100);
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = query.startDate;
      }
      if (query.endDate) {
        where.createdAt.lte = query.endDate;
      }
    }

    const [pageViews, total] = await Promise.all([
      prismaService.pageView.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prismaService.pageView.count({ where }),
    ]);

    return {
      data: pageViews,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async getPageViewStats(query: AnalyticsQuery) {
    const where: any = {};

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = query.startDate;
      }
      if (query.endDate) {
        where.createdAt.lte = query.endDate;
      }
    }

    const [totalViews, uniqueVisitors, topPages, avgDuration] = await Promise.all([
      prismaService.pageView.count({ where }),
      prismaService.pageView.groupBy({
        by: ['sessionId'],
        where: { ...where, sessionId: { not: null } },
        _count: { id: true },
      }),
      prismaService.pageView.groupBy({
        by: ['path'],
        where,
        _count: { id: true },
        orderBy: {
          _count: {
            id: 'desc',
          },
        },
        take: 10,
      }),
      prismaService.pageView.aggregate({
        where: { ...where, duration: { not: null } },
        _avg: { duration: true },
      }),
    ]);

    return {
      totalViews,
      uniqueVisitors: uniqueVisitors.length,
      averageDuration: avgDuration._avg.duration || 0,
      topPages: topPages.map((item) => ({
        path: item.path,
        views: item._count.id,
      })),
    };
  }

  // ==================== Dashboard Stats ====================

  async getDashboardStats(query: DashboardStatsQuery) {
    const cacheKey = `${CACHE_KEYS.DASHBOARD_STATS}:${query.startDate?.toISOString() || 'all'}:${query.endDate?.toISOString() || 'all'}`;

    // Try to get from cache
    const cached = await redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = {};

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = query.startDate;
      }
      if (query.endDate) {
        where.createdAt.lte = query.endDate;
      }
    }

    const [salesStats, customerStats, productStats, orderStats] = await Promise.all([
      this.getSalesAnalytics(query),
      this.getCustomerAnalytics(query),
      prismaService.product.aggregate({
        _count: { id: true },
      }),
      prismaService.order.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
    ]);

    const stats = {
      sales: salesStats,
      customers: customerStats,
      totalProducts: productStats._count.id,
      orders: orderStats.map((item) => ({
        status: item.status,
        count: item._count.id,
      })),
    };

    // Cache for 5 minutes
    await redisService.set(cacheKey, JSON.stringify(stats), CACHE_TTL.SHORT);

    return stats;
  }
}

export default new AnalyticsService();
