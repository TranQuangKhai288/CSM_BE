import prismaService from '@core/database/prisma.service';
import eventEmitter from '@core/events/event-emitter.service';
import { NotFoundError, BadRequestError, ConflictError } from '@common/utils/errors';
import { RESPONSE_CODES } from '@common/constants/response-codes';
import {
  CreateDiscountDto,
  UpdateDiscountDto,
  DiscountResponse,
  DiscountListQuery,
  ValidateDiscountDto,
  ValidateDiscountResponse,
  DiscountStatsResponse,
} from './dto/discounts.dto';

export class DiscountsService {
  /**
   * Get all discounts with filters
   */
  async getDiscounts(query: DiscountListQuery, _userId: string) {
    const {
      page = 1,
      pageSize = 20,
      search,
      type,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    const [discounts, total] = await Promise.all([
      prismaService.discount.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: pageSize,
      }),
      prismaService.discount.count({ where }),
    ]);

    return {
      data: discounts,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * Get discount by ID
   */
  async getDiscountById(id: string, _userId: string): Promise<DiscountResponse> {
    const discount = await prismaService.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      throw new NotFoundError(RESPONSE_CODES.DISCOUNT_NOT_FOUND);
    }

    return discount as any;
  }

  /**
   * Get discount by code
   */
  async getDiscountByCode(code: string): Promise<DiscountResponse> {
    const discount = await prismaService.discount.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!discount) {
      throw new NotFoundError(RESPONSE_CODES.DISCOUNT_NOT_FOUND);
    }

    return discount as any;
  }

  /**
   * Create new discount
   */
  async createDiscount(data: CreateDiscountDto, userId: string): Promise<DiscountResponse> {
    // Check if code already exists
    const existing = await prismaService.discount.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (existing) {
      throw new ConflictError(RESPONSE_CODES.DISCOUNT_CODE_EXISTS);
    }

    // Validate discount value
    if (data.type === 'PERCENTAGE' && data.value > 100) {
      throw new BadRequestError(RESPONSE_CODES.DISCOUNT_INVALID_VALUE);
    }

    if (data.type === 'FIXED_AMOUNT' && data.value <= 0) {
      throw new BadRequestError(RESPONSE_CODES.DISCOUNT_INVALID_VALUE);
    }

    const discount = await prismaService.discount.create({
      data: {
        code: data.code.toUpperCase(),
        name: data.name,
        description: data.description,
        type: data.type,
        value: data.value,
        minOrderValue: data.minOrderValue,
        maxDiscount: data.maxDiscount,
        usageLimit: data.usageLimit,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        isActive: data.isActive ?? true,
      },
    });

    eventEmitter.emit('DISCOUNT_CREATED', {
      discountId: discount.id,
      code: discount.code,
      userId,
    });

    return discount as any;
  }

  /**
   * Update discount
   */
  async updateDiscount(
    id: string,
    data: UpdateDiscountDto,
    userId: string
  ): Promise<DiscountResponse> {
    const discount = await prismaService.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      throw new NotFoundError(RESPONSE_CODES.DISCOUNT_NOT_FOUND);
    }

    // Validate value if provided
    if (data.value !== undefined) {
      if (discount.type === 'PERCENTAGE' && data.value > 100) {
        throw new BadRequestError(RESPONSE_CODES.DISCOUNT_INVALID_VALUE);
      }

      if (discount.type === 'FIXED_AMOUNT' && data.value <= 0) {
        throw new BadRequestError(RESPONSE_CODES.DISCOUNT_INVALID_VALUE);
      }
    }

    const updateData: any = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.value !== undefined) updateData.value = data.value;
    if (data.minOrderValue !== undefined) updateData.minOrderValue = data.minOrderValue;
    if (data.maxDiscount !== undefined) updateData.maxDiscount = data.maxDiscount;
    if (data.usageLimit !== undefined) updateData.usageLimit = data.usageLimit;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await prismaService.discount.update({
      where: { id },
      data: updateData,
    });

    eventEmitter.emit('DISCOUNT_UPDATED', {
      discountId: id,
      userId,
    });

    return updated as any;
  }

  /**
   * Delete discount
   */
  async deleteDiscount(id: string, userId: string): Promise<void> {
    const discount = await prismaService.discount.findUnique({
      where: { id },
    });

    if (!discount) {
      throw new NotFoundError(RESPONSE_CODES.DISCOUNT_NOT_FOUND);
    }

    await prismaService.discount.delete({
      where: { id },
    });

    eventEmitter.emit('DISCOUNT_DELETED', {
      discountId: id,
      userId,
    });
  }

  /**
   * Validate discount code and calculate discount amount
   */
  async validateDiscount(data: ValidateDiscountDto): Promise<ValidateDiscountResponse> {
    const discount = await prismaService.discount.findUnique({
      where: { code: data.code.toUpperCase() },
    });

    if (!discount) {
      return {
        valid: false,
        message: 'Invalid discount code',
      };
    }

    // Check if active
    if (!discount.isActive) {
      return {
        valid: false,
        message: 'This discount code is not active',
      };
    }

    // Check date validity
    const now = new Date();
    if (now < discount.startDate) {
      return {
        valid: false,
        message: 'This discount code is not yet valid',
      };
    }

    if (now > discount.endDate) {
      return {
        valid: false,
        message: 'This discount code has expired',
      };
    }

    // Check usage limit
    if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
      return {
        valid: false,
        message: 'This discount code has reached its usage limit',
      };
    }

    // Check minimum order value
    if (discount.minOrderValue && data.orderTotal < discount.minOrderValue.toNumber()) {
      return {
        valid: false,
        message: `Minimum order value of ${discount.minOrderValue} required`,
      };
    }

    // Calculate discount amount
    let discountAmount = 0;

    switch (discount.type) {
      case 'PERCENTAGE':
        discountAmount = (Number(data.orderTotal) * Number(discount.value)) / 100;
        if (discount.maxDiscount && discountAmount > discount.maxDiscount.toNumber()) {
          discountAmount = discount.maxDiscount.toNumber();
        }
        break;

      case 'FIXED_AMOUNT':
        discountAmount = Math.min(discount.value.toNumber(), Number(data.orderTotal));
        break;

      case 'FREE_SHIPPING':
        discountAmount = discount.value.toNumber(); // Shipping cost should be passed
        break;
    }

    const finalTotal = Math.max(0, data.orderTotal - discountAmount);

    return {
      valid: true,
      discount: discount as any,
      discountAmount,
      finalTotal,
    };
  }

  /**
   * Apply discount (increment usage count)
   */
  async applyDiscount(code: string): Promise<void> {
    await prismaService.discount.update({
      where: { code: code.toUpperCase() },
      data: {
        usageCount: { increment: 1 },
      },
    });

    eventEmitter.emit('DISCOUNT_APPLIED', {
      code: code.toUpperCase(),
    });
  }

  /**
   * Get discount statistics
   */
  async getStats(_userId: string): Promise<DiscountStatsResponse> {
    const now = new Date();

    const [total, active, inactive, expired, mostUsed] = await Promise.all([
      prismaService.discount.count(),
      prismaService.discount.count({
        where: {
          isActive: true,
          startDate: { lte: now },
          endDate: { gte: now },
        },
      }),
      prismaService.discount.count({
        where: { isActive: false },
      }),
      prismaService.discount.count({
        where: { endDate: { lt: now } },
      }),
      prismaService.discount.findMany({
        select: {
          id: true,
          code: true,
          name: true,
          usageCount: true,
        },
        orderBy: { usageCount: 'desc' },
        take: 5,
      }),
    ]);

    const totalUsage = mostUsed.reduce((sum: number, d: any) => sum + d.usageCount, 0);

    return {
      total,
      active,
      inactive,
      expired,
      totalUsage,
      mostUsed,
    };
  }

  /**
   * Get active discounts
   */
  async getActiveDiscounts(): Promise<DiscountResponse[]> {
    const now = new Date();

    const discounts = await prismaService.discount.findMany({
      where: {
        isActive: true,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { createdAt: 'desc' },
    });

    return discounts as any;
  }
}

const discountsService = new DiscountsService();
export default discountsService;
