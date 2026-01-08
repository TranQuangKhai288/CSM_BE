import prismaService from '@core/database/prisma.service';
import redisService from '@core/redis/redis.service';
import { CreateRoleDto, UpdateRoleDto, RoleListQuery } from './dto/roles.dto';
import { ConflictError, NotFoundError, BadRequestError } from '@common/utils/errors';
import { CACHE_KEYS, CACHE_TTL } from '@common/constants';
import slugify from 'slugify';

class RolesService {
  // Get all roles with pagination
  async getRoles(query: RoleListQuery) {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 20, 100);
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [roles, total] = await Promise.all([
      prismaService.role.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { users: true },
          },
        },
      }),
      prismaService.role.count({ where }),
    ]);

    return {
      data: roles,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // Get role by ID
  async getRoleById(id: string) {
    // Check cache first
    const cached = await redisService.getJSON(CACHE_KEYS.USER(id));
    if (cached) return cached;

    const role = await prismaService.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Cache result
    await redisService.setJSON(CACHE_KEYS.USER(id), role, CACHE_TTL.MEDIUM);

    return role;
  }

  // Get role by slug
  async getRoleBySlug(slug: string) {
    const role = await prismaService.role.findUnique({
      where: { slug },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    return role;
  }

  // Create new role
  async createRole(data: CreateRoleDto) {
    // Auto-generate slug if not provided
    const slug = data.slug || slugify(data.name, { lower: true, strict: true });

    // Check if role with same name or slug exists
    const existing = await prismaService.role.findFirst({
      where: {
        OR: [{ name: data.name }, { slug }],
      },
    });

    if (existing) {
      if (existing.name === data.name) {
        throw new ConflictError('Role with this name already exists');
      }
      throw new ConflictError('Role with this slug already exists');
    }

    // Create role
    const role = await prismaService.role.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        permissions: data.permissions as any,
        isActive: true,
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    return role;
  }

  // Update role
  async updateRole(id: string, data: UpdateRoleDto) {
    // Check if role exists
    const role = await prismaService.role.findUnique({ where: { id } });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Check if updating to existing name/slug
    if (data.name || data.slug) {
      const existing = await prismaService.role.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(data.name ? [{ name: data.name }] : []),
                ...(data.slug ? [{ slug: data.slug }] : []),
              ],
            },
          ],
        },
      });

      if (existing) {
        if (data.name && existing.name === data.name) {
          throw new ConflictError('Role with this name already exists');
        }
        if (data.slug && existing.slug === data.slug) {
          throw new ConflictError('Role with this slug already exists');
        }
      }
    }

    // Update role
    const updated = await prismaService.role.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.slug && { slug: data.slug }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.permissions && { permissions: data.permissions as any }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    // Invalidate cache
    await redisService.del(CACHE_KEYS.USER(id));

    // Clear permissions cache for all users with this role
    const users = await prismaService.user.findMany({
      where: { roleId: id },
      select: { id: true },
    });

    await Promise.all(
      users.map((user: { id: string }) => redisService.del(CACHE_KEYS.USER_PERMISSIONS(user.id)))
    );

    return updated;
  }

  // Delete role
  async deleteRole(id: string) {
    // Check if role exists
    const role = await prismaService.role.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!role) {
      throw new NotFoundError('Role not found');
    }

    // Check if role has users
    if (role._count.users > 0) {
      throw new BadRequestError(
        `Cannot delete role with ${role._count.users} assigned user(s). Please reassign or delete users first.`
      );
    }

    // Prevent deleting system roles
    const systemRoles = ['admin', 'manager', 'staff'];
    if (systemRoles.includes(role.slug)) {
      throw new BadRequestError('Cannot delete system role');
    }

    // Delete role
    await prismaService.role.delete({ where: { id } });

    // Clear cache
    await redisService.del(CACHE_KEYS.USER(id));
  }

  // Get all available permissions
  async getAvailablePermissions() {
    // This could be dynamically generated or stored in config
    const permissions = [
      // Users
      'users.read',
      'users.create',
      'users.update',
      'users.delete',
      'users.*',

      // Roles
      'roles.read',
      'roles.create',
      'roles.update',
      'roles.delete',
      'roles.*',

      // Products
      'products.read',
      'products.create',
      'products.update',
      'products.delete',
      'products.*',

      // Orders
      'orders.read',
      'orders.create',
      'orders.update',
      'orders.delete',
      'orders.*',

      // Customers
      'customers.read',
      'customers.create',
      'customers.update',
      'customers.delete',
      'customers.*',

      // Categories
      'categories.read',
      'categories.create',
      'categories.update',
      'categories.delete',
      'categories.*',

      // Inventory
      'inventory.read',
      'inventory.update',
      'inventory.*',

      // Settings
      'settings.read',
      'settings.update',
      'settings.*',

      // Admin - all permissions
      '*',
    ];

    return {
      permissions,
      grouped: {
        users: permissions.filter((p) => p.startsWith('users.')),
        roles: permissions.filter((p) => p.startsWith('roles.')),
        products: permissions.filter((p) => p.startsWith('products.')),
        orders: permissions.filter((p) => p.startsWith('orders.')),
        customers: permissions.filter((p) => p.startsWith('customers.')),
        categories: permissions.filter((p) => p.startsWith('categories.')),
        inventory: permissions.filter((p) => p.startsWith('inventory.')),
        settings: permissions.filter((p) => p.startsWith('settings.')),
        admin: ['*'],
      },
    };
  }
}

export default new RolesService();
