import prismaService from '@core/database/prisma.service';
import redisService from '@core/redis/redis.service';
import { CreateProductDto, UpdateProductDto, ProductListQuery } from './dto/products.dto';
import { ConflictError, NotFoundError, BadRequestError } from '@common/utils/errors';
import { CACHE_KEYS, CACHE_TTL } from '@common/constants';
import { RESPONSE_CODES } from '@common/constants/response-codes';
import eventEmitter, { AppEvents } from '@core/events/event-emitter.service';
import { convertDecimalFields, convertDecimalArray } from '@common/utils/prisma-helpers';

class ProductsService {
  // Generate SKU from name or random
  private generateSKU(name: string): string {
    const prefix = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 3);
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');

    return `${prefix || 'PRD'}-${timestamp}-${random}`;
  }

  // Generate slug from name
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Get all products with pagination
  async getProducts(query: ProductListQuery) {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 20, 100);
    const skip = (page - 1) * pageSize;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.basePrice = {};
      if (query.minPrice !== undefined) {
        where.basePrice.gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        where.basePrice.lte = query.maxPrice;
      }
    }

    if (query.inStock !== undefined) {
      if (query.inStock) {
        where.stock = { gt: 0 };
      } else {
        where.stock = 0;
      }
    }

    if (query.status) {
      where.status = query.status;
    }

    const [products, total] = await Promise.all([
      prismaService.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          images: {
            orderBy: {
              order: 'asc',
            },
          },
          variants: {
            where: {
              isActive: true,
            },
            select: {
              id: true,
              sku: true,
              name: true,
              attributes: true,
              price: true,
              stock: true,
              isActive: true,
            },
          },
        },
      }),
      prismaService.product.count({ where }),
    ]);

    return {
      data: convertDecimalArray(products),
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // Get product by ID
  async getProductById(id: string) {
    // Check cache first
    const cached = await redisService.getJSON(CACHE_KEYS.PRODUCT(id));
    if (cached) return cached;

    const product = await prismaService.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: {
            order: 'asc',
          },
        },
        variants: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found', RESPONSE_CODES.PRODUCT_NOT_FOUND);
    }

    const converted = convertDecimalFields(product);

    // Cache result
    await redisService.setJSON(CACHE_KEYS.PRODUCT(id), converted, CACHE_TTL.MEDIUM);

    return converted;
  }

  // Get product by slug
  async getProductBySlug(slug: string) {
    const product = await prismaService.product.findUnique({
      where: { slug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: {
            order: 'asc',
          },
        },
        variants: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found', RESPONSE_CODES.PRODUCT_NOT_FOUND);
    }

    return convertDecimalFields(product);
  }

  // Get product by SKU
  async getProductBySKU(sku: string) {
    const product = await prismaService.product.findUnique({
      where: { sku },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: {
            order: 'asc',
          },
        },
        variants: {
          where: {
            isActive: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found', RESPONSE_CODES.PRODUCT_NOT_FOUND);
    }

    return convertDecimalFields(product);
  }

  // Create new product
  async createProduct(data: CreateProductDto) {
    // Generate SKU if not provided
    let sku = data.sku;
    if (!sku) {
      sku = this.generateSKU(data.name);

      // Ensure SKU is unique
      let skuExists = await prismaService.product.findUnique({ where: { sku } });
      while (skuExists) {
        sku = this.generateSKU(data.name);
        skuExists = await prismaService.product.findUnique({ where: { sku } });
      }
    } else {
      // Check if SKU already exists
      const existingSKU = await prismaService.product.findUnique({ where: { sku } });
      if (existingSKU) {
        throw new ConflictError(
          'Product with this SKU already exists',
          RESPONSE_CODES.PRODUCT_SKU_EXISTS
        );
      }
    }

    // Generate slug if not provided
    let slug = data.slug || this.generateSlug(data.name);

    // Check if slug already exists
    const existingSlug = await prismaService.product.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now()}`;
    }

    // Verify category exists and is active
    const category = await prismaService.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new BadRequestError('Category not found');
    }

    if (!category.isActive) {
      throw new BadRequestError('Cannot assign product to inactive category');
    }

    // Validate pricing
    if (data.salePrice && data.salePrice > data.basePrice) {
      throw new BadRequestError('Sale price must be greater than base price');
    }
    if (data.costPrice && data.costPrice > data.basePrice) {
      throw new BadRequestError('Cost price must be less than base price');
    }

    // Determine status
    let status: any = 'DRAFT';
    if (data.isActive) {
      status = data.stockQuantity && data.stockQuantity > 0 ? 'PUBLISHED' : 'OUT_OF_STOCK';
    }

    // Create product
    const product = await prismaService.product.create({
      data: {
        name: data.name,
        slug,
        sku,
        description: data.description,
        shortDesc: data.shortDescription,
        categoryId: data.categoryId,
        basePrice: data.basePrice,
        salePrice: data.salePrice,
        costPrice: data.costPrice,
        stock: data.stockQuantity || 0,
        lowStock: data.lowStockThreshold || 10,
        attributes: (data.attributes || []) as any,
        status,
        isActive: data.isActive !== undefined ? data.isActive : true,
        isFeatured: data.isFeatured !== undefined ? data.isFeatured : false,
        metaTitle: data.metaTitle,
        metaDesc: data.metaDescription,
        metaKeywords: data.metaKeywords,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: true,
      },
    });

    // Handle images if provided
    if (data.images && data.images.length > 0) {
      const imageData = data.images.map((img, index) => {
        // Support both string URLs and object format
        if (typeof img === 'string') {
          return {
            productId: product.id,
            url: img,
            order: index,
            isPrimary: index === 0,
          };
        } else {
          return {
            productId: product.id,
            url: img.url,
            alt: img.alt,
            order: index,
            isPrimary: img.isPrimary || index === 0,
          };
        }
      });

      await prismaService.productImage.createMany({
        data: imageData,
      });
    }

    // Emit event
    eventEmitter.emitEvent(AppEvents.PRODUCT_CREATED, { productId: product.id });

    // Check low stock
    if (product.stock > 0 && product.stock <= product.lowStock) {
      eventEmitter.emitEvent(AppEvents.PRODUCT_LOW_STOCK, {
        productId: product.id,
        stock: product.stock,
      });
    }

    // Fetch complete product with images
    const completeProduct = await prismaService.product.findUnique({
      where: { id: product.id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return convertDecimalFields(completeProduct);
  }

  // Update product
  async updateProduct(id: string, data: UpdateProductDto) {
    // Check if product exists
    const product = await prismaService.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundError('Product not found', RESPONSE_CODES.PRODUCT_NOT_FOUND);
    }

    // Check SKU uniqueness if changing
    if (data.sku && data.sku !== product.sku) {
      const existingSKU = await prismaService.product.findUnique({ where: { sku: data.sku } });
      if (existingSKU) {
        throw new ConflictError(
          'Product with this SKU already exists',
          RESPONSE_CODES.PRODUCT_SKU_EXISTS
        );
      }
    }

    // Check slug uniqueness if changing
    if (data.slug && data.slug !== product.slug) {
      const existingSlug = await prismaService.product.findUnique({ where: { slug: data.slug } });
      if (existingSlug) {
        throw new ConflictError(
          'Product with this slug already exists',
          RESPONSE_CODES.PRODUCT_SLUG_EXISTS
        );
      }
    }

    // Generate slug from name if name is changing but slug is not provided
    let slug = data.slug;
    if (data.name && !data.slug) {
      slug = this.generateSlug(data.name);

      if (slug !== product.slug) {
        const existingSlug = await prismaService.product.findUnique({ where: { slug } });
        if (existingSlug) {
          slug = `${slug}-${Date.now()}`;
        }
      }
    }

    // Verify category if changing
    if (data.categoryId && data.categoryId !== product.categoryId) {
      const category = await prismaService.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new BadRequestError('Category not found');
      }

      if (!category.isActive) {
        throw new BadRequestError('Cannot assign product to inactive category');
      }
    }

    // Validate pricing if changing
    const newBasePrice = data.basePrice !== undefined ? data.basePrice : Number(product.basePrice);

    if (data.salePrice && data.salePrice > newBasePrice) {
      throw new BadRequestError('Sale price must be greater than base price');
    }

    if (data.costPrice && data.costPrice > newBasePrice) {
      throw new BadRequestError('Cost price must be less than base price');
    }

    const oldStock = product.stock;

    // Determine new status if stock or isActive changes
    let newStatus = product.status;
    if (data.isActive !== undefined || data.stockQuantity !== undefined) {
      const willBeActive = data.isActive !== undefined ? data.isActive : product.isActive;
      const newStock = data.stockQuantity !== undefined ? data.stockQuantity : product.stock;

      if (willBeActive) {
        newStatus = newStock > 0 ? 'PUBLISHED' : 'OUT_OF_STOCK';
      } else {
        newStatus = 'DRAFT';
      }
    }

    // Update product
    const updated = await prismaService.product.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(slug && { slug }),
        ...(data.sku && { sku: data.sku }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.shortDescription !== undefined && { shortDesc: data.shortDescription }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.basePrice !== undefined && { basePrice: data.basePrice }),
        ...(data.salePrice !== undefined && { salePrice: data.salePrice }),
        ...(data.costPrice !== undefined && { costPrice: data.costPrice }),
        ...(data.stockQuantity !== undefined && { stock: data.stockQuantity }),
        ...(data.lowStockThreshold !== undefined && { lowStock: data.lowStockThreshold }),
        ...(data.attributes !== undefined && { attributes: data.attributes as any }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle }),
        ...(data.metaDescription !== undefined && { metaDesc: data.metaDescription }),
        ...(data.metaKeywords !== undefined && { metaKeywords: data.metaKeywords }),
        status: newStatus,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Handle images update if provided
    if (data.images !== undefined) {
      // Delete existing images
      await prismaService.productImage.deleteMany({
        where: { productId: id },
      });

      // Create new images if any
      if (data.images.length > 0) {
        const imageData = data.images.map((img, index) => {
          // Support both string URLs and object format
          if (typeof img === 'string') {
            return {
              productId: id,
              url: img,
              order: index,
              isPrimary: index === 0,
            };
          } else {
            return {
              productId: id,
              url: img.url,
              alt: img.alt,
              order: index,
              isPrimary: img.isPrimary || index === 0,
            };
          }
        });

        await prismaService.productImage.createMany({
          data: imageData,
        });
      }
    }

    // Clear cache
    await redisService.del(CACHE_KEYS.PRODUCT(id));

    // Emit event
    eventEmitter.emitEvent(AppEvents.PRODUCT_UPDATED, { productId: id });

    // Check stock status changes
    if (updated.stock === 0 && oldStock > 0) {
      eventEmitter.emitEvent(AppEvents.PRODUCT_OUT_OF_STOCK, { productId: id });
    } else if (
      updated.stock > 0 &&
      updated.stock <= updated.lowStock &&
      oldStock > updated.lowStock
    ) {
      eventEmitter.emitEvent(AppEvents.PRODUCT_LOW_STOCK, { productId: id, stock: updated.stock });
    }

    // Fetch complete product with updated images
    const completeProduct = await prismaService.product.findUnique({
      where: { id },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return convertDecimalFields(completeProduct);
  }

  // Delete product
  async deleteProduct(id: string) {
    // Check if product exists
    const product = await prismaService.product.findUnique({ where: { id } });

    if (!product) {
      throw new NotFoundError('Product not found', RESPONSE_CODES.PRODUCT_NOT_FOUND);
    }

    // TODO: Check if product is in any orders (optional - depends on business logic)
    // You might want to soft delete instead

    // Delete product
    await prismaService.product.delete({ where: { id } });

    // Clear cache
    await redisService.del(CACHE_KEYS.PRODUCT(id));

    // Emit event
    eventEmitter.emitEvent(AppEvents.PRODUCT_DELETED, { productId: id });
  }

  // Get product statistics
  async getProductStats() {
    const [total, active, inactive, featured, outOfStock, lowStock, products, byCategory] =
      await Promise.all([
        prismaService.product.count(),
        prismaService.product.count({ where: { isActive: true } }),
        prismaService.product.count({ where: { isActive: false } }),
        prismaService.product.count({ where: { isFeatured: true } }),
        prismaService.product.count({ where: { stock: 0 } }),
        prismaService.product.count({
          where: {
            stock: { gt: 0, lte: prismaService.product.fields.lowStock },
          },
        }),
        prismaService.product.findMany({
          where: { isActive: true },
          select: { basePrice: true, stock: true, costPrice: true },
        }),
        prismaService.product.groupBy({
          by: ['categoryId'],
          _count: true,
        }),
      ]);

    // Calculate total inventory value
    const totalValue = products.reduce((sum: number, p: any) => {
      return sum + Number(p.basePrice) * p.stock;
    }, 0);

    // Get category names
    const categoryIds = byCategory.map((c: any) => c.categoryId);
    const categories = await prismaService.category.findMany({
      where: { id: { in: categoryIds } },
      select: { id: true, name: true },
    });

    const byCategoryWithNames = byCategory.map((c: any) => {
      const category = categories.find((cat: any) => cat.id === c.categoryId);
      return {
        categoryId: c.categoryId,
        categoryName: category?.name || 'Unknown',
        count: c._count,
      };
    });

    return {
      total,
      active,
      inactive,
      featured,
      outOfStock,
      lowStock,
      totalValue: Math.round(totalValue * 100) / 100,
      byCategory: byCategoryWithNames,
    };
  }
}

export default new ProductsService();
