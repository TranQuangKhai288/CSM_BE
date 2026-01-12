import prismaService from '@core/database/prisma.service';
import redisService from '@core/redis/redis.service';
import eventEmitter, { AppEvents } from '@core/events/event-emitter.service';
import { NotFoundError, ConflictError } from '@common/utils/errors';
import { RESPONSE_CODES } from '@common/constants/response-codes';
import { CreateCustomerDto, UpdateCustomerDto, CustomerListQuery } from './dto/customers.dto';

const CACHE_KEYS = {
  CUSTOMER: (id: string) => `customer:${id}`,
  CUSTOMER_EMAIL: (email: string) => `customer:email:${email}`,
};

const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 3600, // 1 hour
};

class CustomersService {
  // Get customers with filtering and pagination
  async getCustomers(query: CustomerListQuery) {
    const page = parseInt(query.page as any) || 1;
    const pageSize = parseInt(query.pageSize as any) || 20;
    const skip = (page - 1) * pageSize;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const where: any = {};

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.minSpent !== undefined || query.maxSpent !== undefined) {
      where.totalSpent = {};
      if (query.minSpent !== undefined) {
        where.totalSpent.gte = query.minSpent;
      }
      if (query.maxSpent !== undefined) {
        where.totalSpent.lte = query.maxSpent;
      }
    }

    if (query.minOrders !== undefined) {
      where.totalOrders = { gte: query.minOrders };
    }

    if (query.hasOrders !== undefined) {
      if (query.hasOrders) {
        where.totalOrders = { gt: 0 };
      } else {
        where.totalOrders = 0;
      }
    }

    const [customers, total] = await Promise.all([
      prismaService.customer.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
      }),
      prismaService.customer.count({ where }),
    ]);

    return {
      data: customers,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // Get customer by ID
  async getCustomerById(id: string) {
    // Check cache first
    const cached = await redisService.getJSON(CACHE_KEYS.CUSTOMER(id));
    if (cached) return cached;

    const customer = await prismaService.customer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found', RESPONSE_CODES.CUSTOMER_NOT_FOUND);
    }

    // Cache result
    await redisService.setJSON(CACHE_KEYS.CUSTOMER(id), customer, CACHE_TTL.MEDIUM);

    return customer;
  }

  // Get customer by email
  async getCustomerByEmail(email: string) {
    const customer = await prismaService.customer.findUnique({
      where: { email },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found', RESPONSE_CODES.CUSTOMER_NOT_FOUND);
    }

    return customer;
  }

  // Create new customer
  async createCustomer(data: CreateCustomerDto) {
    // Check if email already exists
    const existingCustomer = await prismaService.customer.findUnique({
      where: { email: data.email },
    });

    if (existingCustomer) {
      throw new ConflictError(
        'Customer with this email already exists',
        RESPONSE_CODES.CUSTOMER_EMAIL_EXISTS
      );
    }

    // Create customer
    const customer = await prismaService.customer.create({
      data: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        avatar: data.avatar,
        addresses: data.addresses ? JSON.stringify(data.addresses) : JSON.stringify([]),
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });

    // Emit event
    eventEmitter.emitEvent(AppEvents.CUSTOMER_CREATED, { customerId: customer.id });

    return customer;
  }

  // Update customer
  async updateCustomer(id: string, data: UpdateCustomerDto) {
    // Check if customer exists
    const customer = await prismaService.customer.findUnique({ where: { id } });

    if (!customer) {
      throw new NotFoundError('Customer not found', RESPONSE_CODES.CUSTOMER_NOT_FOUND);
    }

    // Check email uniqueness if changing
    if (data.email && data.email !== customer.email) {
      const existingEmail = await prismaService.customer.findUnique({
        where: { email: data.email },
      });
      if (existingEmail) {
        throw new ConflictError(
          'Customer with this email already exists',
          RESPONSE_CODES.CUSTOMER_EMAIL_EXISTS
        );
      }
    }

    // Update customer
    const updated = await prismaService.customer.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        ...(data.addresses !== undefined && { addresses: JSON.stringify(data.addresses) }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });

    // Clear cache
    await redisService.del(CACHE_KEYS.CUSTOMER(id));
    if (customer.email !== updated.email) {
      await redisService.del(CACHE_KEYS.CUSTOMER_EMAIL(customer.email));
    }

    // Emit event
    eventEmitter.emitEvent(AppEvents.CUSTOMER_UPDATED, { customerId: id });

    return updated;
  }

  // Delete customer
  async deleteCustomer(id: string) {
    // Check if customer exists
    const customer = await prismaService.customer.findUnique({
      where: { id },
      include: {
        _count: {
          select: { orders: true },
        },
      },
    });

    if (!customer) {
      throw new NotFoundError('Customer not found', RESPONSE_CODES.CUSTOMER_NOT_FOUND);
    }

    // Check if customer has orders
    if (customer._count.orders > 0) {
      throw new ConflictError(
        'Cannot delete customer with existing orders. Deactivate instead.',
        RESPONSE_CODES.VALIDATION_ERROR
      );
    }

    // Delete customer
    await prismaService.customer.delete({ where: { id } });

    // Clear cache
    await redisService.del(CACHE_KEYS.CUSTOMER(id));
    await redisService.del(CACHE_KEYS.CUSTOMER_EMAIL(customer.email));

    // Emit event
    eventEmitter.emitEvent(AppEvents.CUSTOMER_DELETED, { customerId: id });
  }

  // Get customer statistics
  async getCustomerStats() {
    const [total, active, inactive, withOrders, customers, topCustomers] = await Promise.all([
      prismaService.customer.count(),
      prismaService.customer.count({ where: { isActive: true } }),
      prismaService.customer.count({ where: { isActive: false } }),
      prismaService.customer.count({ where: { totalOrders: { gt: 0 } } }),
      prismaService.customer.findMany({
        where: { totalOrders: { gt: 0 } },
        select: { totalSpent: true, totalOrders: true },
      }),
      prismaService.customer.findMany({
        where: { totalOrders: { gt: 0 } },
        orderBy: { totalSpent: 'desc' },
        take: 10,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          totalSpent: true,
          totalOrders: true,
        },
      }),
    ]);

    // Calculate averages
    const totalRevenue = customers.reduce((sum: number, c: any) => sum + Number(c.totalSpent), 0);
    const totalOrdersCount = customers.reduce((sum: number, c: any) => sum + c.totalOrders, 0);
    const averageSpent = withOrders > 0 ? totalRevenue / withOrders : 0;
    const averageOrders = withOrders > 0 ? totalOrdersCount / withOrders : 0;

    return {
      total,
      active,
      inactive,
      withOrders,
      totalRevenue,
      averageSpent,
      averageOrders,
      topCustomers: topCustomers.map((c: any) => ({
        ...c,
        totalSpent: Number(c.totalSpent),
      })),
    };
  }

  // Add loyalty points
  async addLoyaltyPoints(customerId: string, points: number) {
    const customer = await prismaService.customer.update({
      where: { id: customerId },
      data: {
        loyaltyPoints: { increment: points },
      },
    });

    // Clear cache
    await redisService.del(CACHE_KEYS.CUSTOMER(customerId));

    return customer;
  }

  // Deduct loyalty points
  async deductLoyaltyPoints(customerId: string, points: number) {
    const customer = (await this.getCustomerById(customerId)) as { loyaltyPoints: number };

    if (customer.loyaltyPoints < points) {
      throw new ConflictError('Insufficient loyalty points', RESPONSE_CODES.VALIDATION_ERROR);
    }

    const updated = await prismaService.customer.update({
      where: { id: customerId },
      data: {
        loyaltyPoints: { decrement: points },
      },
    });

    // Clear cache
    await redisService.del(CACHE_KEYS.CUSTOMER(customerId));

    return updated;
  }
}

export default new CustomersService();
