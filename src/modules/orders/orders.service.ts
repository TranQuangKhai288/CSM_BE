import prismaService from '@core/database/prisma.service';
import redisService from '@core/redis/redis.service';
import eventEmitter, { AppEvents } from '@core/events/event-emitter.service';
import { NotFoundError, BadRequestError } from '@common/utils/errors';
import { RESPONSE_CODES } from '@common/constants/response-codes';
import {
  CreateOrderDto,
  UpdateOrderDto,
  OrderListQuery,
  UpdateOrderStatusDto,
} from './dto/orders.dto';

const CACHE_KEYS = {
  ORDER: (id: string) => `order:${id}`,
  ORDER_NUMBER: (orderNumber: string) => `order:number:${orderNumber}`,
};

const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
};

class OrdersService {
  // Generate unique order number
  private async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Get count of orders today
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const count = await prismaService.order.count({
      where: {
        createdAt: { gte: startOfDay },
      },
    });

    const sequence = String(count + 1).padStart(4, '0');
    return `ORD${year}${month}${day}${sequence}`;
  }

  // Get orders with filtering and pagination
  async getOrders(query: OrderListQuery) {
    const page = parseInt(query.page as any) || 1;
    const pageSize = parseInt(query.pageSize as any) || 20;
    const skip = (page - 1) * pageSize;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const where: any = {};

    if (query.search) {
      where.OR = [
        { orderNumber: { contains: query.search, mode: 'insensitive' } },
        { customer: { email: { contains: query.search, mode: 'insensitive' } } },
        { customer: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.paymentStatus) {
      where.paymentStatus = query.paymentStatus;
    }

    if (query.minTotal !== undefined || query.maxTotal !== undefined) {
      where.total = {};
      if (query.minTotal !== undefined) {
        where.total.gte = query.minTotal;
      }
      if (query.maxTotal !== undefined) {
        where.total.lte = query.maxTotal;
      }
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    const [orders, total] = await Promise.all([
      prismaService.order.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatar: true,
            },
          },
          items: true,
        },
      }),
      prismaService.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // Get order by ID
  async getOrderById(id: string) {
    // Check cache first
    const cached = await redisService.getJSON(CACHE_KEYS.ORDER(id));
    if (cached) return cached;

    const order = await prismaService.order.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found', RESPONSE_CODES.ORDER_NOT_FOUND);
    }

    // Cache result
    await redisService.setJSON(CACHE_KEYS.ORDER(id), order, CACHE_TTL.MEDIUM);

    return order;
  }

  // Get order by order number
  async getOrderByNumber(orderNumber: string) {
    const order = await prismaService.order.findUnique({
      where: { orderNumber },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found', RESPONSE_CODES.ORDER_NOT_FOUND);
    }

    return order;
  }

  // Create new order
  async createOrder(data: CreateOrderDto, userId?: string) {
    // Verify customer exists
    const customer = await prismaService.customer.findUnique({
      where: { id: data.customerId },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found', RESPONSE_CODES.CUSTOMER_NOT_FOUND);
    }

    if (!customer.isActive) {
      throw new BadRequestError('Customer account is inactive');
    }

    // Verify all products exist and calculate pricing
    const productIds = data.items.map((item) => item.productId);
    const products = await prismaService.product.findMany({
      where: { id: { in: productIds } },
    });

    if (products.length !== productIds.length) {
      throw new NotFoundError('One or more products not found', RESPONSE_CODES.PRODUCT_NOT_FOUND);
    }

    // Check stock and calculate subtotal
    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of data.items) {
      const product = products.find((p: any) => p.id === item.productId);
      if (!product) continue;

      // Check if product is active
      if (!product.isActive) {
        throw new BadRequestError(`Product "${product.name}" is not available`);
      }

      // Check stock
      if (product.stock < item.quantity) {
        throw new BadRequestError(
          `Insufficient stock for product "${product.name}". Available: ${product.stock}`,
          RESPONSE_CODES.PRODUCT_INSUFFICIENT_STOCK
        );
      }

      const price = product.salePrice ? Number(product.salePrice) : Number(product.basePrice);
      const itemTotal = price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        productId: product.id,
        variantId: item.variantId,
        name: product.name,
        sku: product.sku,
        quantity: item.quantity,
        price,
        total: itemTotal,
      });
    }

    // Calculate total
    const discount = data.discount || 0;
    const tax = data.tax || 0;
    const shipping = data.shipping || 0;
    const total = subtotal - discount + tax + shipping;

    // Generate order number
    const orderNumber = await this.generateOrderNumber();

    // Create order with items in a transaction
    const order = await prismaService.$transaction(async (tx: any) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: data.customerId,
          userId,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          paymentMethod: data.paymentMethod,
          subtotal,
          discount,
          tax,
          shipping,
          total,
          shippingAddress: data.shippingAddress,
          billingAddress: data.billingAddress || data.shippingAddress,
          notes: data.notes,
          metadata: data.metadata,
          items: {
            create: orderItems,
          },
        },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatar: true,
            },
          },
          items: true,
        },
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: newOrder.id,
          status: 'PENDING',
          note: 'Order created',
          createdBy: userId,
        },
      });

      return newOrder;
    });

    // Emit event
    eventEmitter.emitEvent(AppEvents.ORDER_CREATED, {
      orderId: order.id,
      customerId: order.customerId,
      total: Number(order.total),
    });

    return order;
  }

  // Update order
  async updateOrder(id: string, data: UpdateOrderDto, userId?: string) {
    // Check if order exists
    const order = await prismaService.order.findUnique({ where: { id } });

    if (!order) {
      throw new NotFoundError('Order not found', RESPONSE_CODES.ORDER_NOT_FOUND);
    }

    // Cannot update cancelled or refunded orders
    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      throw new BadRequestError('Cannot update cancelled or refunded orders');
    }

    const updated = await prismaService.order.update({
      where: { id },
      data: {
        ...(data.status && { status: data.status }),
        ...(data.paymentStatus && { paymentStatus: data.paymentStatus }),
        ...(data.paymentMethod && { paymentMethod: data.paymentMethod }),
        ...(data.trackingNumber !== undefined && { trackingNumber: data.trackingNumber }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.metadata !== undefined && { metadata: data.metadata }),
      },
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
          },
        },
        items: true,
      },
    });

    // Clear cache
    await redisService.del(CACHE_KEYS.ORDER(id));
    await redisService.del(CACHE_KEYS.ORDER_NUMBER(order.orderNumber));

    // Emit event
    eventEmitter.emitEvent(AppEvents.ORDER_UPDATED, { orderId: id });

    return updated;
  }

  // Update order status
  async updateOrderStatus(id: string, data: UpdateOrderStatusDto, userId?: string) {
    const order = await prismaService.order.findUnique({
      where: { id },
      include: {
        items: true,
        customer: true,
      },
    });

    if (!order) {
      throw new NotFoundError('Order not found', RESPONSE_CODES.ORDER_NOT_FOUND);
    }

    // Validate status transition
    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['SHIPPED', 'CANCELLED'],
      SHIPPED: ['DELIVERED', 'CANCELLED'],
      DELIVERED: ['REFUNDED'],
      CANCELLED: [],
      REFUNDED: [],
    };

    if (!allowedTransitions[order.status].includes(data.status)) {
      throw new BadRequestError(
        `Cannot change order status from ${order.status} to ${data.status}`
      );
    }

    const updated = await prismaService.$transaction(async (tx: any) => {
      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          status: data.status,
          ...(data.status === 'DELIVERED' && { completedAt: new Date() }),
        },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
              avatar: true,
            },
          },
          items: true,
        },
      });

      // Create status history
      await tx.orderStatusHistory.create({
        data: {
          orderId: id,
          status: data.status,
          note: data.note,
          createdBy: userId,
        },
      });

      // Deduct stock when order is confirmed
      if (data.status === 'CONFIRMED') {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { decrement: item.quantity },
            },
          });
        }
      }

      // Restore stock if order is cancelled
      if (data.status === 'CANCELLED' && order.status === 'CONFIRMED') {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
            },
          });
        }
      }

      // Update customer stats when order is delivered
      if (data.status === 'DELIVERED') {
        await tx.customer.update({
          where: { id: order.customerId },
          data: {
            totalOrders: { increment: 1 },
            totalSpent: { increment: Number(order.total) },
          },
        });
      }

      return updatedOrder;
    });

    // Clear cache
    await redisService.del(CACHE_KEYS.ORDER(id));
    await redisService.del(CACHE_KEYS.ORDER_NUMBER(order.orderNumber));

    // Emit events
    if (data.status === 'CONFIRMED') {
      eventEmitter.emitEvent(AppEvents.ORDER_CREATED, {
        orderId: id,
        customerId: order.customerId,
      });
    } else if (data.status === 'CANCELLED') {
      eventEmitter.emitEvent(AppEvents.ORDER_CANCELLED, { orderId: id });
    } else if (data.status === 'SHIPPED') {
      eventEmitter.emitEvent(AppEvents.ORDER_SHIPPED, { orderId: id });
    } else if (data.status === 'DELIVERED') {
      eventEmitter.emitEvent(AppEvents.ORDER_COMPLETED, {
        orderId: id,
        customerId: order.customerId,
        total: Number(order.total),
      });
    }

    return updated;
  }

  // Get order statistics
  async getOrderStats() {
    const [
      total,
      pending,
      confirmed,
      processing,
      shipped,
      delivered,
      cancelled,
      refunded,
      orders,
      recentOrders,
    ] = await Promise.all([
      prismaService.order.count(),
      prismaService.order.count({ where: { status: 'PENDING' } }),
      prismaService.order.count({ where: { status: 'CONFIRMED' } }),
      prismaService.order.count({ where: { status: 'PROCESSING' } }),
      prismaService.order.count({ where: { status: 'SHIPPED' } }),
      prismaService.order.count({ where: { status: 'DELIVERED' } }),
      prismaService.order.count({ where: { status: 'CANCELLED' } }),
      prismaService.order.count({ where: { status: 'REFUNDED' } }),
      prismaService.order.findMany({
        where: { status: 'DELIVERED' },
        select: { total: true },
      }),
      prismaService.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          orderNumber: true,
          total: true,
          status: true,
          createdAt: true,
          customer: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
              avatar: true,
            },
          },
        },
      }),
    ]);

    const totalRevenue = orders.reduce((sum: number, order: any) => sum + Number(order.total), 0);
    const averageOrderValue = delivered > 0 ? totalRevenue / delivered : 0;

    return {
      total,
      pending,
      confirmed,
      processing,
      shipped,
      delivered,
      cancelled,
      refunded,
      totalRevenue,
      averageOrderValue,
      recentOrders: recentOrders.map((order: any) => ({
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: `${order.customer.firstName} ${order.customer.lastName}`,
        total: Number(order.total),
        status: order.status,
        createdAt: order.createdAt,
      })),
    };
  }

  // Cancel order
  async cancelOrder(id: string, note?: string, userId?: string) {
    return this.updateOrderStatus(id, { status: 'CANCELLED', note }, userId);
  }
}

export default new OrdersService();
