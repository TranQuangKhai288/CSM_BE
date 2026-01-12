import prismaService from '@core/database/prisma.service';
import eventEmitter from '@core/events/event-emitter.service';
import { NotFoundError, BadRequestError } from '@common/utils/errors';
import { RESPONSE_CODES } from '@common/constants/response-codes';
import {
  CreateInventoryLogDto,
  AdjustStockDto,
  InventoryLogResponse,
  InventoryListQuery,
  InventoryStatsResponse,
  LowStockProduct,
} from './dto/inventory.dto';

export class InventoryService {
  /**
   * Get inventory logs with filters
   */
  async getLogs(query: InventoryListQuery, _userId: string) {
    const {
      page = 1,
      pageSize = 20,
      productId,
      type,
      startDate,
      endDate,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [logs, total] = await Promise.all([
      prismaService.inventoryLog.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              stock: true,
            },
          },
          // user: {
          //   select: {
          //     id: true,
          //     email: true,
          //     firstName: true,
          //     lastName: true,
          //   },
          // },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }),
      prismaService.inventoryLog.count({ where }),
    ]);

    return {
      data: logs,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get a single inventory log by ID
   */
  async getLogById(id: string, _userId: string): Promise<InventoryLogResponse> {
    const log = await prismaService.inventoryLog.findUnique({
      where: { id },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            stock: true,
          },
        },
        // user: {
        //   select: {
        //     id: true,
        //     email: true,
        //     firstName: true,
        //     lastName: true,
        //   },
        // },
      },
    });

    if (!log) {
      throw new NotFoundError(RESPONSE_CODES.INVENTORY_NOT_FOUND);
    }

    return log as any;
  }

  /**
   * Create inventory log manually
   */
  async createLog(data: CreateInventoryLogDto, userId: string): Promise<InventoryLogResponse> {
    const product = await prismaService.product.findUnique({
      where: { id: data.productId },
    });

    if (!product) {
      throw new NotFoundError(RESPONSE_CODES.PRODUCT_NOT_FOUND);
    }

    const beforeStock = product.stock;
    let afterStock = beforeStock;

    // Calculate new stock based on type
    switch (data.type) {
      case 'PURCHASE':
      case 'RETURN':
        afterStock = beforeStock + Math.abs(data.quantity);
        break;
      case 'SALE':
      case 'DAMAGE':
        afterStock = beforeStock - Math.abs(data.quantity);
        break;
      case 'ADJUSTMENT':
        afterStock = beforeStock + data.quantity;
        break;
    }

    if (afterStock < 0) {
      throw new BadRequestError(RESPONSE_CODES.INVENTORY_INSUFFICIENT_STOCK);
    }

    const log = await prismaService.$transaction(async (tx: any) => {
      // Update product stock
      await tx.product.update({
        where: { id: data.productId },
        data: { stock: afterStock },
      });

      // Create inventory log
      return tx.inventoryLog.create({
        data: {
          productId: data.productId,
          type: data.type,
          quantity: Math.abs(data.quantity),
          before: beforeStock,
          after: afterStock,
          note: data.note,
          createdBy: userId,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              stock: true,
            },
          },
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
    });

    eventEmitter.emit('INVENTORY_UPDATED', {
      productId: data.productId,
      type: data.type,
      quantity: data.quantity,
      beforeStock,
      afterStock,
      userId,
    });

    return log as any;
  }

  /**
   * Adjust stock (simplified method for adjustments)
   */
  async adjustStock(data: AdjustStockDto, userId: string): Promise<InventoryLogResponse> {
    return this.createLog(
      {
        productId: data.productId,
        type: data.type,
        quantity: data.quantity,
        note: data.note,
      },
      userId
    );
  }

  /**
   * Get inventory statistics
   */
  async getStats(_userId: string): Promise<InventoryStatsResponse> {
    const [totalLogs, totalProducts, lowStockCount, outOfStockCount, recentLogs, topMovements] =
      await Promise.all([
        prismaService.inventoryLog.count(),
        prismaService.product.count(),
        prismaService.product.count({
          where: {
            stock: { gt: 0, lte: 10 },
          },
        }),
        prismaService.product.count({
          where: { stock: 0 },
        }),
        prismaService.inventoryLog.findMany({
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        }),
        prismaService.inventoryLog.groupBy({
          by: ['productId', 'type'],
          _sum: {
            quantity: true,
          },
          orderBy: {
            _sum: {
              quantity: 'desc',
            },
          },
          take: 5,
        }),
      ]);

    return {
      totalLogs,
      totalProducts,
      lowStockCount,
      outOfStockCount,
      recentActivity: recentLogs as any,
      topMovements: topMovements as any,
    };
  }

  /**
   * Get products with low stock
   */
  async getLowStockProducts(
    threshold = 10,
    page = 1,
    pageSize = 20
  ): Promise<{ data: LowStockProduct[]; pagination: any }> {
    const skip = (page - 1) * pageSize;

    const [products, total] = await Promise.all([
      prismaService.product.findMany({
        where: {
          stock: { lte: threshold, gt: 0 },
        },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { stock: 'asc' },
        skip,
        take: pageSize,
      }),
      prismaService.product.count({
        where: {
          stock: { lte: threshold, gt: 0 },
        },
      }),
    ]);

    return {
      data: products as any,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get out of stock products
   */
  async getOutOfStockProducts(
    page = 1,
    pageSize = 20
  ): Promise<{ data: LowStockProduct[]; pagination: any }> {
    const skip = (page - 1) * pageSize;

    const [products, total] = await Promise.all([
      prismaService.product.findMany({
        where: { stock: 0 },
        select: {
          id: true,
          name: true,
          sku: true,
          stock: true,
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prismaService.product.count({
        where: { stock: 0 },
      }),
    ]);

    return {
      data: products as any,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }
}

const inventoryService = new InventoryService();
export default inventoryService;
