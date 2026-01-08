import prismaService from '@core/database/prisma.service';
import redisService from '@core/redis/redis.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CategoryListQuery,
  CategoryTreeNode,
} from './dto/categories.dto';
import { ConflictError, NotFoundError, BadRequestError } from '@common/utils/errors';
import { CACHE_KEYS, CACHE_TTL } from '@common/constants';
import { RESPONSE_CODES } from '@common/constants/response-codes';
import eventEmitter, { AppEvents } from '@core/events/event-emitter.service';

class CategoriesService {
  // Generate slug from name
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // Check for circular reference in parent-child relationship
  private async checkCircularReference(categoryId: string, parentId: string): Promise<boolean> {
    let currentId: string | null = parentId;

    while (currentId) {
      if (currentId === categoryId) {
        return true; // Circular reference detected
      }

      const parent: { parentId: string | null } | null = await prismaService.category.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      });

      currentId = parent?.parentId || null;
    }

    return false;
  }

  // Get all categories with pagination
  async getCategories(query: CategoryListQuery) {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 20, 100);
    const skip = (page - 1) * pageSize;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.parentId !== undefined) {
      where.parentId = query.parentId === 'null' ? null : query.parentId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [categories, total] = await Promise.all([
      prismaService.category.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              products: true,
              children: true,
            },
          },
        },
      }),
      prismaService.category.count({ where }),
    ]);

    return {
      data: categories,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // Get category tree (hierarchical structure)
  async getCategoryTree(): Promise<CategoryTreeNode[]> {
    // Check cache first
    const cached = await redisService.getJSON('category:tree');
    if (cached) return cached as CategoryTreeNode[];

    const categories = await prismaService.category.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });

    // Build tree structure
    const categoryMap = new Map();
    const tree: CategoryTreeNode[] = [];

    // Create map
    categories.forEach((cat: any) => {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        image: cat.image,
        isActive: cat.isActive,
        children: [],
        _count: cat._count,
      });
    });

    // Build tree
    categories.forEach((cat: any) => {
      const node = categoryMap.get(cat.id);
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(node);
        }
      } else {
        tree.push(node);
      }
    });

    // Cache result
    await redisService.setJSON('category:tree', tree, CACHE_TTL.MEDIUM);

    return tree;
  }

  // Get category by ID
  async getCategoryById(id: string) {
    // Check cache first
    const cached = await redisService.getJSON(CACHE_KEYS.CATEGORY(id));
    if (cached) return cached;

    const category = await prismaService.category.findUnique({
      where: { id },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found', RESPONSE_CODES.CATEGORY_NOT_FOUND);
    }

    // Cache result
    await redisService.setJSON(CACHE_KEYS.CATEGORY(id), category, CACHE_TTL.MEDIUM);

    return category;
  }

  // Get category by slug
  async getCategoryBySlug(slug: string) {
    const category = await prismaService.category.findUnique({
      where: { slug },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        children: {
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found', RESPONSE_CODES.CATEGORY_NOT_FOUND);
    }

    return category;
  }

  // Create new category
  async createCategory(data: CreateCategoryDto) {
    // Generate slug if not provided
    const slug = data.slug || this.generateSlug(data.name);

    // Check if slug already exists
    const existingSlug = await prismaService.category.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      throw new ConflictError(
        'Category with this slug already exists',
        RESPONSE_CODES.CATEGORY_SLUG_EXISTS
      );
    }

    // Verify parent category if provided
    if (data.parentId) {
      const parent = await prismaService.category.findUnique({
        where: { id: data.parentId },
      });

      if (!parent) {
        throw new BadRequestError('Parent category not found');
      }

      if (!parent.isActive) {
        throw new BadRequestError('Cannot assign inactive parent category');
      }
    }

    // Create category
    const category = await prismaService.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        parentId: data.parentId || null,
        image: data.image,
        isActive: data.isActive !== undefined ? data.isActive : true,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        metaKeywords: data.metaKeywords,
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    // Clear tree cache
    await redisService.del('category:tree');

    // Emit event
    eventEmitter.emitEvent(AppEvents.CATEGORY_CREATED, { categoryId: category.id });

    return category;
  }

  // Update category
  async updateCategory(id: string, data: UpdateCategoryDto) {
    // Check if category exists
    const category = await prismaService.category.findUnique({ where: { id } });

    if (!category) {
      throw new NotFoundError('Category not found', RESPONSE_CODES.CATEGORY_NOT_FOUND);
    }

    // Check slug uniqueness if changing
    if (data.slug && data.slug !== category.slug) {
      const existingSlug = await prismaService.category.findUnique({
        where: { slug: data.slug },
      });

      if (existingSlug) {
        throw new ConflictError(
          'Category with this slug already exists',
          RESPONSE_CODES.CATEGORY_SLUG_EXISTS
        );
      }
    }

    // Generate slug from name if name is changing but slug is not provided
    let slug = data.slug;
    if (data.name && !data.slug) {
      slug = this.generateSlug(data.name);

      // Check new generated slug
      if (slug !== category.slug) {
        const existingSlug = await prismaService.category.findUnique({
          where: { slug },
        });

        if (existingSlug) {
          slug = `${slug}-${Date.now()}`;
        }
      }
    }

    // Verify parent category if changing
    if (data.parentId !== undefined) {
      if (data.parentId) {
        // Check if parent exists
        const parent = await prismaService.category.findUnique({
          where: { id: data.parentId },
        });

        if (!parent) {
          throw new BadRequestError('Parent category not found');
        }

        if (!parent.isActive) {
          throw new BadRequestError('Cannot assign inactive parent category');
        }

        // Check for circular reference
        const isCircular = await this.checkCircularReference(id, data.parentId);
        if (isCircular) {
          throw new BadRequestError(
            'Cannot set parent: circular reference detected',
            RESPONSE_CODES.CATEGORY_CIRCULAR_REFERENCE
          );
        }
      }
    }

    // Update category
    const updated = await prismaService.category.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(slug && { slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.image !== undefined && { image: data.image }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.metaTitle !== undefined && { metaTitle: data.metaTitle }),
        ...(data.metaDescription !== undefined && { metaDescription: data.metaDescription }),
        ...(data.metaKeywords !== undefined && { metaKeywords: data.metaKeywords }),
      },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    // Clear caches
    await redisService.del(CACHE_KEYS.CATEGORY(id));
    await redisService.del('category:tree');

    // Emit event
    eventEmitter.emitEvent(AppEvents.CATEGORY_UPDATED, { categoryId: id });

    return updated;
  }

  // Delete category
  async deleteCategory(id: string) {
    // Check if category exists
    const category = await prismaService.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            products: true,
            children: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundError('Category not found', RESPONSE_CODES.CATEGORY_NOT_FOUND);
    }

    // Check if category has products
    if (category._count.products > 0) {
      throw new BadRequestError(
        `Cannot delete category with ${category._count.products} products. Remove products first.`,
        RESPONSE_CODES.CATEGORY_HAS_PRODUCTS
      );
    }

    // Check if category has children
    if (category._count.children > 0) {
      throw new BadRequestError(
        `Cannot delete category with ${category._count.children} subcategories. Remove subcategories first.`,
        RESPONSE_CODES.CATEGORY_HAS_CHILDREN
      );
    }

    // Delete category
    await prismaService.category.delete({ where: { id } });

    // Clear caches
    await redisService.del(CACHE_KEYS.CATEGORY(id));
    await redisService.del('category:tree');

    // Emit event
    eventEmitter.emitEvent(AppEvents.CATEGORY_DELETED, { categoryId: id });
  }
}

export default new CategoriesService();
